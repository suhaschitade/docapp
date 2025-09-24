using ClosedXML.Excel;
using PatientManagementApi.Models;
using PatientManagementApi.Data;
using DataMigration.Models;
using DataMigration.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace DataMigration.Services;

public class ExcelImportService
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<ExcelImportService> _logger;

    public ExcelImportService(ApplicationDbContext context, ILogger<ExcelImportService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<ImportResult> ImportFromExcelAsync(string filePath, string createdBy = "System")
    {
        var result = new ImportResult
        {
            ImportStartTime = DateTime.UtcNow
        };

        try
        {
            _logger.LogInformation("Starting Excel import from: {FilePath}", filePath);
            
            if (!File.Exists(filePath))
            {
                result.ErrorMessages.Add($"File not found: {filePath}");
                result.Errors = 1;
                return result;
            }

            using var workbook = new XLWorkbook(filePath);
            var sheetResults = new List<SheetImportResult>();

            foreach (var worksheet in workbook.Worksheets)
            {
                _logger.LogInformation("Processing sheet: {SheetName}", worksheet.Name);
                
                var sheetResult = await ProcessWorksheetAsync(worksheet, createdBy);
                sheetResults.Add(sheetResult);
                
                result.TotalRecords += sheetResult.TotalRecords;
                result.SuccessfulImports += sheetResult.SuccessfulImports;
                result.SkippedRecords += sheetResult.SkippedRecords;
                result.Errors += sheetResult.Errors;
                result.ErrorMessages.AddRange(sheetResult.ErrorMessages.Select(e => $"{worksheet.Name}: {e}"));

                _logger.LogInformation("Sheet {SheetName} completed: {Success} success, {Errors} errors", 
                    worksheet.Name, sheetResult.SuccessfulImports, sheetResult.Errors);
            }

            // Records are saved individually, no final save needed
            
            result.ImportEndTime = DateTime.UtcNow;
            _logger.LogInformation("Import completed: {Total} records processed, {Success} imported successfully", 
                result.TotalRecords, result.SuccessfulImports);

            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during Excel import");
            result.ErrorMessages.Add($"Import failed: {ex.Message}");
            result.Errors++;
            result.ImportEndTime = DateTime.UtcNow;
            return result;
        }
    }

    private async Task<SheetImportResult> ProcessWorksheetAsync(IXLWorksheet worksheet, string createdBy)
    {
        var result = new SheetImportResult
        {
            SheetName = worksheet.Name,
            CancerSite = CancerSiteMapping.GetCancerSite(worksheet.Name)
        };

        var usedRange = worksheet.RangeUsed();
        if (usedRange == null || usedRange.RowCount() <= 1)
        {
            result.WarningMessages.Add("Sheet is empty or has no data rows");
            return result;
        }

        try
        {
            var records = ExtractRecordsFromSheet(worksheet);
            result.TotalRecords = records.Count;

            foreach (var record in records)
            {
                try
                {
                    // Check for duplicate by OriginalMRN
                    var existingPatient = await _context.Patients
                        .FirstOrDefaultAsync(p => p.OriginalMRN == record.MRN);

                    if (existingPatient != null)
                    {
                        result.SkippedRecords++;
                        continue; // Skip duplicate
                    }

                    // Create and immediately save each patient individually
                    var patient = CreatePatientFromRecord(record, createdBy);
                    _context.Patients.Add(patient);
                    
                    try
                    {
                        await _context.SaveChangesAsync();
                        result.SuccessfulImports++;
                        
                        if (result.SuccessfulImports % 100 == 0)
                        {
                            _logger.LogInformation("Imported {Count} records from sheet {Sheet}", result.SuccessfulImports, worksheet.Name);
                        }
                    }
                    catch (Exception saveEx)
                    {
                        // Log the specific save error and remove the failed entity
                        result.Errors++;
                        result.ErrorMessages.Add($"Row {record.RowNumber}: Save failed - {saveEx.Message}");
                        _logger.LogWarning("Save failed for row {Row} in sheet {Sheet}: {Error}", record.RowNumber, worksheet.Name, saveEx.Message);
                        
                        // Remove the failed entity from context
                        var entry = _context.Entry(patient);
                        if (entry.State != Microsoft.EntityFrameworkCore.EntityState.Detached)
                        {
                            entry.State = Microsoft.EntityFrameworkCore.EntityState.Detached;
                        }
                    }
                }
                catch (Exception ex)
                {
                    result.Errors++;
                    result.ErrorMessages.Add($"Row {record.RowNumber}: {ex.Message}");
                    _logger.LogWarning("Error processing row {Row} in sheet {Sheet}: {Error}", record.RowNumber, worksheet.Name, ex.Message);
                }
            }
        }
        catch (Exception ex)
        {
            result.Errors++;
            result.ErrorMessages.Add($"Error processing sheet: {ex.Message}");
            _logger.LogError(ex, "Error processing sheet {SheetName}", worksheet.Name);
        }

        return result;
    }

    private List<ExcelPatientRecord> ExtractRecordsFromSheet(IXLWorksheet worksheet)
    {
        var records = new List<ExcelPatientRecord>();
        var usedRange = worksheet.RangeUsed();
        
        if (usedRange.RowCount() <= 1) return records;

        // Get headers from first row
        var headerRow = usedRange.FirstRow();
        var headers = new Dictionary<int, string>();
        
        for (int col = 1; col <= usedRange.ColumnCount(); col++)
        {
            var headerValue = headerRow.Cell(col).GetString().Trim().ToLowerInvariant();
            headers[col] = headerValue;
        }

        // Process data rows
        for (int row = 2; row <= usedRange.RowCount(); row++)
        {
            var dataRow = usedRange.Row(row);
            var record = new ExcelPatientRecord
            {
                SheetName = worksheet.Name,
                RowNumber = row
            };

            for (int col = 1; col <= usedRange.ColumnCount(); col++)
            {
                var cellValue = dataRow.Cell(col).GetString().Trim();
                var header = headers.GetValueOrDefault(col, "");

                MapCellToRecord(record, header, cellValue);
            }

            // Only add record if it has essential data
            if (!string.IsNullOrWhiteSpace(record.Name) && !string.IsNullOrWhiteSpace(record.MRN))
            {
                records.Add(record);
            }
        }

        return records;
    }

    private void MapCellToRecord(ExcelPatientRecord record, string header, string value)
    {
        switch (header)
        {
            case "sno" or "sl no" or "serial no":
                record.SerialNumber = value;
                break;
            case "name":
                record.Name = value;
                break;
            case "mrn no." or "mrn no" or "mh no":
                record.MRN = value;
                break;
            case "year":
                record.Year = value;
                break;
            case "diagnosis":
                record.Diagnosis = value;
                break;
            case "stage":
                record.Stage = value;
                break;
            case "age":
                record.Age = value;
                break;
            case "sex" or "gender":
                record.Sex = value;
                break;
            case "contact no" or "contact no 1" or "contact no1":
                record.ContactNo1 = value;
                break;
            case "contact no 2" or "contact no2":
                record.ContactNo2 = value;
                break;
            case "contact no 3" or "contact no3":
                record.ContactNo3 = value;
                break;
            case "address":
                record.Address = value;
                break;
            case "date logged in" or "date logged in" or "date of logging in":
                record.DateLoggedIn = value;
                break;
        }
    }

    private Patient CreatePatientFromRecord(ExcelPatientRecord record, string createdBy)
    {
        var (firstName, lastName) = DataCleaningService.SplitName(record.Name);
        var age = DataCleaningService.ParseAge(record.Age);
        var gender = DataCleaningService.ParseGender(record.Sex);
        var registrationYear = DataCleaningService.ParseYear(record.Year);
        var (city, state) = DataCleaningService.ExtractCityState(record.Address);

        var patient = new Patient
        {
            PatientId = DataCleaningService.GeneratePatientId(record.MRN, record.SheetName),
            FirstName = firstName,
            LastName = lastName,
            Age = age ?? 0,
            Gender = gender,
            MobileNumber = DataCleaningService.CleanPhoneNumber(record.ContactNo1),
            Address = record.Address,
            City = city,
            State = state,
            Country = "India",
            
            // Cancer information
            PrimaryCancerSite = CancerSiteMapping.GetCancerSite(record.SheetName),
            CancerStage = DataCleaningService.CleanStage(record.Stage),
            SiteSpecificDiagnosis = record.Diagnosis,
            DiagnosisDate = registrationYear.HasValue ? DateTime.SpecifyKind(new DateTime(registrationYear.Value, 1, 1), DateTimeKind.Utc) : null,
            TreatmentPathway = TreatmentPathwayType.Curative,
            CurrentStatus = PatientStatusType.Active,
            RiskLevel = RiskLevelType.Medium,

            // Excel import specific fields
            RegistrationYear = registrationYear,
            SecondaryContactPhone = DataCleaningService.CleanPhoneNumber(record.ContactNo2),
            TertiaryContactPhone = DataCleaningService.CleanPhoneNumber(record.ContactNo3),
            DateLoggedIn = DataCleaningService.ParseDateLoggedIn(record.DateLoggedIn),
            ExcelSheetSource = record.SheetName,
            ExcelRowNumber = record.RowNumber,
            OriginalMRN = record.MRN,
            ImportedFromExcel = true,

            // Metadata
            CreatedBy = "4bbb55e0-fb2f-424c-83b7-e973b405af13", // Admin user ID
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            RegistrationDate = registrationYear.HasValue ? DateTime.SpecifyKind(new DateTime(registrationYear.Value, 1, 1), DateTimeKind.Utc) : DateTime.SpecifyKind(DateTime.Today, DateTimeKind.Utc)
        };

        return patient;
    }

    public async Task<List<Patient>> GetImportedPatientsAsync(string? sheetName = null)
    {
        var query = _context.Patients.Where(p => p.ImportedFromExcel);
        
        if (!string.IsNullOrEmpty(sheetName))
        {
            query = query.Where(p => p.ExcelSheetSource == sheetName);
        }

        return await query.OrderBy(p => p.ExcelSheetSource)
                         .ThenBy(p => p.ExcelRowNumber)
                         .ToListAsync();
    }

    public async Task<ImportResult> ValidateImportDataAsync(string filePath)
    {
        var result = new ImportResult
        {
            ImportStartTime = DateTime.UtcNow
        };

        try
        {
            if (!File.Exists(filePath))
            {
                result.ErrorMessages.Add($"File not found: {filePath}");
                result.Errors = 1;
                return result;
            }

            using var workbook = new XLWorkbook(filePath);
            
            foreach (var worksheet in workbook.Worksheets)
            {
                var records = ExtractRecordsFromSheet(worksheet);
                result.TotalRecords += records.Count;

                foreach (var record in records)
                {
                    var validationErrors = ValidateRecord(record);
                    if (validationErrors.Any())
                    {
                        result.Errors++;
                        result.ErrorMessages.AddRange(validationErrors.Select(e => $"{worksheet.Name} Row {record.RowNumber}: {e}"));
                    }
                    else
                    {
                        result.SuccessfulImports++;
                    }
                }
            }

            result.ImportEndTime = DateTime.UtcNow;
            return result;
        }
        catch (Exception ex)
        {
            result.ErrorMessages.Add($"Validation failed: {ex.Message}");
            result.Errors++;
            result.ImportEndTime = DateTime.UtcNow;
            return result;
        }
    }

    private List<string> ValidateRecord(ExcelPatientRecord record)
    {
        var errors = new List<string>();

        if (string.IsNullOrWhiteSpace(record.Name))
            errors.Add("Name is required");

        if (string.IsNullOrWhiteSpace(record.MRN))
            errors.Add("MRN is required");

        var age = DataCleaningService.ParseAge(record.Age);
        if (!age.HasValue && !string.IsNullOrWhiteSpace(record.Age))
            errors.Add($"Invalid age format: {record.Age}");

        var year = DataCleaningService.ParseYear(record.Year);
        if (!year.HasValue && !string.IsNullOrWhiteSpace(record.Year))
            errors.Add($"Invalid year format: {record.Year}");

        var gender = DataCleaningService.ParseGender(record.Sex);
        if (gender == Gender.Other && !string.IsNullOrWhiteSpace(record.Sex))
            errors.Add($"Invalid gender: {record.Sex}");

        return errors;
    }
}