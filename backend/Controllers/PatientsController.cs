using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PatientManagementApi.Data;
using PatientManagementApi.Models;
using System.Security.Claims;

namespace PatientManagementApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Policy = "StaffPolicy")] // Staff, Admin, Doctor, Nurse can access
public class PatientsController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<PatientsController> _logger;

    public PatientsController(ApplicationDbContext context, ILogger<PatientsController> logger)
    {
        _context = context;
        _logger = logger;
    }

    // Helper method to parse gender from various formats
    private Gender ParseGender(string genderStr)
    {
        if (string.IsNullOrEmpty(genderStr))
            throw new ArgumentException("Gender cannot be null or empty");

        // Handle single character format
        if (genderStr.Length == 1)
        {
            return genderStr.ToUpper() switch
            {
                "M" => Gender.Male,
                "F" => Gender.Female,
                "O" => Gender.Other,
                _ => throw new ArgumentException($"Invalid gender character: {genderStr}")
            };
        }

        // Handle full name format
        return genderStr.ToLower() switch
        {
            "male" => Gender.Male,
            "female" => Gender.Female,
            "other" => Gender.Other,
            _ => throw new ArgumentException($"Invalid gender value: {genderStr}")
        };
    }

    // Helper method to parse cancer site type
    private CancerSiteType ParseCancerSiteType(string cancerSiteStr)
    {
        if (string.IsNullOrEmpty(cancerSiteStr))
            throw new ArgumentException("Cancer site cannot be null or empty");

        if (Enum.TryParse<CancerSiteType>(cancerSiteStr, true, out var result))
            return result;
        
        throw new ArgumentException($"Invalid cancer site value: {cancerSiteStr}");
    }

    // Helper method to parse treatment pathway type
    private TreatmentPathwayType ParseTreatmentPathwayType(string treatmentPathwayStr)
    {
        if (string.IsNullOrEmpty(treatmentPathwayStr))
            throw new ArgumentException("Treatment pathway cannot be null or empty");

        if (Enum.TryParse<TreatmentPathwayType>(treatmentPathwayStr, true, out var result))
            return result;
        
        throw new ArgumentException($"Invalid treatment pathway value: {treatmentPathwayStr}");
    }

    // Helper method to parse patient status type
    private PatientStatusType ParsePatientStatusType(string statusStr)
    {
        if (string.IsNullOrEmpty(statusStr))
            throw new ArgumentException("Patient status cannot be null or empty");

        if (Enum.TryParse<PatientStatusType>(statusStr, true, out var result))
            return result;
        
        throw new ArgumentException($"Invalid patient status value: {statusStr}");
    }

    // Helper method to parse risk level type
    private RiskLevelType ParseRiskLevelType(string riskLevelStr)
    {
        if (string.IsNullOrEmpty(riskLevelStr))
            throw new ArgumentException("Risk level cannot be null or empty");

        if (Enum.TryParse<RiskLevelType>(riskLevelStr, true, out var result))
            return result;
        
        throw new ArgumentException($"Invalid risk level value: {riskLevelStr}");
    }

    // GET: api/patients
    [HttpGet]
    public async Task<ActionResult<IEnumerable<PatientDto>>> GetPatients(
        [FromQuery] string? search = null,
        [FromQuery] PatientStatusType? status = null,
        [FromQuery] string? cancerSite = null,
        [FromQuery] RiskLevelType? riskLevel = null,
        [FromQuery] string? assignedDoctorId = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10)
    {
        try
        {
            var query = _context.Patients
                .Include(p => p.AssignedDoctor)
                .Include(p => p.Creator)
                .AsQueryable();

            // Apply filters
            if (!string.IsNullOrEmpty(search))
            {
                var searchUpper = search.ToUpper();
                query = query.Where(p => 
                    p.FirstName.ToUpper().Contains(searchUpper) ||
                    p.LastName.ToUpper().Contains(searchUpper) ||
                    p.PatientId.ToUpper().Contains(searchUpper) ||
                    p.MobileNumber.Contains(search));
            }

            if (status.HasValue)
            {
                query = query.Where(p => p.CurrentStatus == status.Value);
            }

            if (!string.IsNullOrEmpty(cancerSite))
            {
                // Case-insensitive comparison of cancer site
                query = query.Where(p => p.PrimaryCancerSite.ToString().ToUpper() == cancerSite.ToUpper());
            }

            if (riskLevel.HasValue)
            {
                query = query.Where(p => p.RiskLevel == riskLevel.Value);
            }

            if (!string.IsNullOrEmpty(assignedDoctorId))
            {
                // Show patients assigned to this doctor OR patients with no assigned doctor
                query = query.Where(p => p.AssignedDoctorId == assignedDoctorId || p.AssignedDoctorId == null);
            }

            // Get total count for pagination
            var totalCount = await query.CountAsync();

            // Apply pagination
            var patients = await query
                .OrderByDescending(p => p.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(p => new PatientDto
                {
                    Id = p.Id,
                    PatientId = p.PatientId,
                    FirstName = p.FirstName,
                    LastName = p.LastName,
                    Age = p.Age,
                    Gender = p.Gender.ToString(),
                    MobileNumber = p.MobileNumber,
                    Email = p.Email,
                    Address = p.Address,
                    City = p.City,
                    State = p.State,
                    PostalCode = p.PostalCode,
                    Country = p.Country,
                    EmergencyContactName = p.EmergencyContactName,
                    EmergencyContactPhone = p.EmergencyContactPhone,
                    PrimaryCancerSite = p.PrimaryCancerSite.ToString(),
                    CancerStage = p.CancerStage,
                    Histology = p.Histology,
                    DiagnosisDate = p.DiagnosisDate,
                    TreatmentPathway = p.TreatmentPathway.ToString(),
                    CurrentStatus = p.CurrentStatus.ToString(),
                    RiskLevel = p.RiskLevel.ToString(),
                    AssignedDoctorId = p.AssignedDoctorId,
                    AssignedDoctorName = p.AssignedDoctor != null ? $"{p.AssignedDoctor.FirstName} {p.AssignedDoctor.LastName}" : null,
                    RegistrationDate = p.RegistrationDate,
                    LastVisitDate = p.LastVisitDate,
                    NextFollowupDate = p.NextFollowupDate,
                    // Additional fields
                    SiteSpecificDiagnosis = p.SiteSpecificDiagnosis,
                    RegistrationYear = p.RegistrationYear,
                    SecondaryContactPhone = p.SecondaryContactPhone,
                    TertiaryContactPhone = p.TertiaryContactPhone,
                    DateLoggedIn = p.DateLoggedIn,
                    ExcelSheetSource = p.ExcelSheetSource,
                    ExcelRowNumber = p.ExcelRowNumber,
                    OriginalMRN = p.OriginalMRN,
                    ImportedFromExcel = p.ImportedFromExcel,
                    CreatedBy = p.CreatedBy,
                    CreatedAt = p.CreatedAt,
                    UpdatedAt = p.UpdatedAt
                })
                .ToListAsync();

            var response = new
            {
                Data = patients,
                TotalCount = totalCount,
                Page = page,
                PageSize = pageSize,
                TotalPages = (int)Math.Ceiling((double)totalCount / pageSize)
            };

            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving patients");
            return StatusCode(500, "An error occurred while retrieving patients");
        }
    }

    // GET: api/patients/{id}
    [HttpGet("{id}")]
    public async Task<ActionResult<PatientDetailDto>> GetPatient(int id)
    {
        try
        {
            var patient = await _context.Patients
                .Include(p => p.AssignedDoctor)
                .Include(p => p.Creator)
                .Include(p => p.Appointments.OrderByDescending(a => a.AppointmentDate))
                .Include(p => p.Treatments.OrderByDescending(t => t.CreatedAt))
                .Include(p => p.Investigations.OrderByDescending(i => i.OrderedDate))
                .FirstOrDefaultAsync(p => p.Id == id);

            if (patient == null)
            {
                return NotFound($"Patient with ID {id} not found");
            }

            var patientDetail = new PatientDetailDto
            {
                Id = patient.Id,
                PatientId = patient.PatientId,
                FirstName = patient.FirstName,
                LastName = patient.LastName,
                Age = patient.Age,
                Gender = patient.Gender.ToString(),
                MobileNumber = patient.MobileNumber,
                Email = patient.Email,
                Address = patient.Address,
                City = patient.City,
                State = patient.State,
                PostalCode = patient.PostalCode,
                Country = patient.Country,
                EmergencyContactName = patient.EmergencyContactName,
                EmergencyContactPhone = patient.EmergencyContactPhone,
                PrimaryCancerSite = patient.PrimaryCancerSite.ToString(),
                CancerStage = patient.CancerStage,
                Histology = patient.Histology,
                DiagnosisDate = patient.DiagnosisDate,
                TreatmentPathway = patient.TreatmentPathway.ToString(),
                CurrentStatus = patient.CurrentStatus.ToString(),
                RiskLevel = patient.RiskLevel.ToString(),
                AssignedDoctorId = patient.AssignedDoctorId,
                AssignedDoctorName = patient.AssignedDoctor != null ? $"{patient.AssignedDoctor.FirstName} {patient.AssignedDoctor.LastName}" : null,
                RegistrationDate = patient.RegistrationDate,
                LastVisitDate = patient.LastVisitDate,
                NextFollowupDate = patient.NextFollowupDate,
                // Additional fields
                SiteSpecificDiagnosis = patient.SiteSpecificDiagnosis,
                RegistrationYear = patient.RegistrationYear,
                SecondaryContactPhone = patient.SecondaryContactPhone,
                TertiaryContactPhone = patient.TertiaryContactPhone,
                DateLoggedIn = patient.DateLoggedIn,
                ExcelSheetSource = patient.ExcelSheetSource,
                ExcelRowNumber = patient.ExcelRowNumber,
                OriginalMRN = patient.OriginalMRN,
                ImportedFromExcel = patient.ImportedFromExcel,
                CreatedBy = patient.CreatedBy,
                CreatedAt = patient.CreatedAt,
                UpdatedAt = patient.UpdatedAt,
                RecentAppointments = patient.Appointments.Take(5).Select(a => new AppointmentSummaryDto
                {
                    Id = a.Id,
                    AppointmentDate = a.AppointmentDate,
                    AppointmentTime = a.AppointmentTime.ToTimeSpan(),
                    AppointmentType = a.AppointmentType,
                    Status = a.Status.ToString(),
                    Notes = a.Notes
                }).ToList(),
                CurrentTreatments = patient.Treatments.Where(t => t.Status == "active").Select(t => new TreatmentSummaryDto
                {
                    Id = t.Id,
                    TreatmentType = t.TreatmentType,
                    TreatmentName = t.TreatmentName ?? string.Empty,
                    StartDate = t.StartDate ?? DateTime.MinValue,
                    Status = t.Status
                }).ToList(),
                PendingInvestigations = patient.Investigations.Where(i => i.Status == "pending").Select(i => new InvestigationSummaryDto
                {
                    Id = i.Id,
                    InvestigationType = i.InvestigationType,
                    InvestigationName = i.InvestigationName,
                    OrderedDate = i.OrderedDate,
                    Status = i.Status
                }).ToList()
            };

            return Ok(patientDetail);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving patient {PatientId}", id);
            return StatusCode(500, "An error occurred while retrieving the patient");
        }
    }

    // POST: api/patients
    [HttpPost]
    [Authorize(Roles = "Staff,Admin")] // Only Staff and Admin can create patients
    public async Task<ActionResult<PatientDto>> CreatePatient(CreatePatientDto createPatientDto)
    {
        try
        {
            var currentUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            // Check if patient ID already exists
            if (await _context.Patients.AnyAsync(p => p.PatientId == createPatientDto.PatientId))
            {
                return BadRequest($"Patient ID {createPatientDto.PatientId} already exists");
            }

            var patient = new Patient
            {
                PatientId = createPatientDto.PatientId,
                FirstName = createPatientDto.FirstName,
                LastName = createPatientDto.LastName,
                Age = createPatientDto.Age,
                Gender = ParseGender(createPatientDto.Gender),
                MobileNumber = createPatientDto.MobileNumber,
                Email = createPatientDto.Email,
                Address = createPatientDto.Address,
                City = createPatientDto.City,
                State = createPatientDto.State,
                PostalCode = createPatientDto.PostalCode,
                Country = createPatientDto.Country ?? "India",
                EmergencyContactName = createPatientDto.EmergencyContactName,
                EmergencyContactPhone = createPatientDto.EmergencyContactPhone,
                PrimaryCancerSite = ParseCancerSiteType(createPatientDto.PrimaryCancerSite),
                CancerStage = createPatientDto.CancerStage,
                Histology = createPatientDto.Histology,
                DiagnosisDate = createPatientDto.DiagnosisDate.HasValue ? DateTime.SpecifyKind(createPatientDto.DiagnosisDate.Value, DateTimeKind.Utc) : null,
                TreatmentPathway = ParseTreatmentPathwayType(createPatientDto.TreatmentPathway),
                CurrentStatus = PatientStatusType.Active,
                RiskLevel = ParseRiskLevelType(createPatientDto.RiskLevel),
                AssignedDoctorId = createPatientDto.AssignedDoctorId,
                RegistrationDate = DateTime.SpecifyKind(DateTime.Today, DateTimeKind.Utc),
                NextFollowupDate = createPatientDto.NextFollowupDate.HasValue ? DateTime.SpecifyKind(createPatientDto.NextFollowupDate.Value, DateTimeKind.Utc) : null,
                CreatedBy = currentUserId,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Patients.Add(patient);
            await _context.SaveChangesAsync();

            // Reload with navigation properties
            await _context.Entry(patient)
                .Reference(p => p.AssignedDoctor)
                .LoadAsync();

            var patientDto = new PatientDto
            {
                Id = patient.Id,
                PatientId = patient.PatientId,
                FirstName = patient.FirstName,
                LastName = patient.LastName,
                Age = patient.Age,
                Gender = patient.Gender.ToString(),
                MobileNumber = patient.MobileNumber,
                Email = patient.Email,
                Address = patient.Address,
                City = patient.City,
                State = patient.State,
                PostalCode = patient.PostalCode,
                Country = patient.Country,
                EmergencyContactName = patient.EmergencyContactName,
                EmergencyContactPhone = patient.EmergencyContactPhone,
                PrimaryCancerSite = patient.PrimaryCancerSite.ToString(),
                CancerStage = patient.CancerStage,
                Histology = patient.Histology,
                DiagnosisDate = patient.DiagnosisDate,
                TreatmentPathway = patient.TreatmentPathway.ToString(),
                CurrentStatus = patient.CurrentStatus.ToString(),
                RiskLevel = patient.RiskLevel.ToString(),
                AssignedDoctorId = patient.AssignedDoctorId,
                AssignedDoctorName = patient.AssignedDoctor != null ? $"{patient.AssignedDoctor.FirstName} {patient.AssignedDoctor.LastName}" : null,
                RegistrationDate = patient.RegistrationDate,
                LastVisitDate = patient.LastVisitDate,
                NextFollowupDate = patient.NextFollowupDate,
                CreatedAt = patient.CreatedAt,
                UpdatedAt = patient.UpdatedAt
            };

            return CreatedAtAction(nameof(GetPatient), new { id = patient.Id }, patientDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating patient");
            return StatusCode(500, "An error occurred while creating the patient");
        }
    }

    // PUT: api/patients/{id}
    [HttpPut("{id}")]
    [Authorize(Roles = "Staff,Admin")] // Only Staff and Admin can update patients
    public async Task<IActionResult> UpdatePatient(int id, UpdatePatientDto updatePatientDto)
    {
        try
        {
            var patient = await _context.Patients.FindAsync(id);
            if (patient == null)
            {
                return NotFound($"Patient with ID {id} not found");
            }

            // Check if patient ID already exists (excluding current patient)
            if (updatePatientDto.PatientId != patient.PatientId && 
                await _context.Patients.AnyAsync(p => p.PatientId == updatePatientDto.PatientId))
            {
                return BadRequest($"Patient ID {updatePatientDto.PatientId} already exists");
            }

            // Update properties
            patient.PatientId = updatePatientDto.PatientId;
            patient.FirstName = updatePatientDto.FirstName;
            patient.LastName = updatePatientDto.LastName;
            patient.Age = updatePatientDto.Age;
            patient.Gender = ParseGender(updatePatientDto.Gender);
            patient.MobileNumber = updatePatientDto.MobileNumber;
            patient.Email = updatePatientDto.Email;
            patient.Address = updatePatientDto.Address;
            patient.City = updatePatientDto.City;
            patient.State = updatePatientDto.State;
            patient.PostalCode = updatePatientDto.PostalCode;
            patient.Country = updatePatientDto.Country ?? "India";
            patient.EmergencyContactName = updatePatientDto.EmergencyContactName;
            patient.EmergencyContactPhone = updatePatientDto.EmergencyContactPhone;
            patient.PrimaryCancerSite = ParseCancerSiteType(updatePatientDto.PrimaryCancerSite);
            patient.CancerStage = updatePatientDto.CancerStage;
            patient.Histology = updatePatientDto.Histology;
            patient.DiagnosisDate = updatePatientDto.DiagnosisDate.HasValue ? DateTime.SpecifyKind(updatePatientDto.DiagnosisDate.Value, DateTimeKind.Utc) : null;
            patient.TreatmentPathway = ParseTreatmentPathwayType(updatePatientDto.TreatmentPathway);
            patient.CurrentStatus = ParsePatientStatusType(updatePatientDto.CurrentStatus);
            patient.RiskLevel = ParseRiskLevelType(updatePatientDto.RiskLevel);
            patient.AssignedDoctorId = updatePatientDto.AssignedDoctorId;
            patient.NextFollowupDate = updatePatientDto.NextFollowupDate.HasValue ? DateTime.SpecifyKind(updatePatientDto.NextFollowupDate.Value, DateTimeKind.Utc) : null;
            patient.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating patient {PatientId}", id);
            return StatusCode(500, "An error occurred while updating the patient");
        }
    }

    // DELETE: api/patients/{id}
    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> DeletePatient(int id)
    {
        try
        {
            var patient = await _context.Patients.FindAsync(id);
            if (patient == null)
            {
                return NotFound($"Patient with ID {id} not found");
            }

            _context.Patients.Remove(patient);
            await _context.SaveChangesAsync();

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting patient {PatientId}", id);
            return StatusCode(500, "An error occurred while deleting the patient");
        }
    }

    // GET: api/patients/statistics
    [HttpGet("statistics")]
    public async Task<ActionResult<PatientStatisticsDto>> GetPatientStatistics()
    {
        try
        {
            var statistics = new PatientStatisticsDto
            {
                TotalPatients = await _context.Patients.CountAsync(),
                ActivePatients = await _context.Patients.CountAsync(p => p.CurrentStatus == PatientStatusType.Active),
                NewPatientsThisMonth = await _context.Patients
                    .CountAsync(p => p.RegistrationDate >= new DateTime(DateTime.Today.Year, DateTime.Today.Month, 1)),
                HighRiskPatients = await _context.Patients
                    .CountAsync(p => p.RiskLevel == RiskLevelType.High || p.RiskLevel == RiskLevelType.Critical),
                OverdueFollowups = await _context.Patients
                    .CountAsync(p => p.NextFollowupDate.HasValue && p.NextFollowupDate < DateTime.Today),
                PatientsByStatus = await _context.Patients
                    .GroupBy(p => p.CurrentStatus)
                    .Select(g => new StatusCountDto { Status = g.Key.ToString(), Count = g.Count() })
                    .ToListAsync(),
                PatientsByCancerSite = await _context.Patients
                    .GroupBy(p => p.PrimaryCancerSite)
                    .Select(g => new CancerSiteCountDto { CancerSite = g.Key.ToString(), Count = g.Count() })
                    .OrderByDescending(x => x.Count)
                    .ToListAsync()
            };

            return Ok(statistics);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving patient statistics");
            return StatusCode(500, "An error occurred while retrieving statistics");
        }
    }
}
