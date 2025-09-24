# Excel Patient Data Import Tool

This tool imports patient data from the "Site wise Data collection.xlsx" file into the patient management system database.

## Features

- **Multi-sheet Support**: Processes all 33 cancer site-specific sheets in the Excel file
- **Data Cleaning**: Automatically cleans and standardizes data formats
- **Duplicate Prevention**: Skips records that already exist (based on MRN)
- **Validation**: Can validate data without importing
- **Comprehensive Logging**: Detailed progress and error reporting
- **Cancer Site Mapping**: Maps Excel sheet names to appropriate cancer site types

## Prerequisites

1. .NET 9.0 SDK installed
2. PostgreSQL database running
3. Patient Management API database schema set up
4. Excel file "Site wise Data collection.xlsx" available

## Setup

1. **Update Database Connection**: Edit `appsettings.json` and set the correct PostgreSQL connection string:
   ```json
   {
     "ConnectionStrings": {
       "DefaultConnection": "Host=localhost;Database=patient_management_db;Username=postgres;Password=your_password;Port=5432"
     }
   }
   ```

2. **Run Database Migration**: First, apply the new migration to add the required columns:
   ```bash
   cd ../backend
   dotnet ef database update
   ```

3. **Build the Tool**:
   ```bash
   cd DataMigration
   dotnet build
   ```

## Usage

### Basic Import
```bash
dotnet run -- --file "../Site wise Data collection.xlsx"
```

### Validation Only (Recommended First)
```bash
dotnet run -- --file "../Site wise Data collection.xlsx" --validate-only
```

### Custom Creator
```bash
dotnet run -- --file "../Site wise Data collection.xlsx" --created-by "Admin User"
```

### Command Line Options

- `--file <path>`: Path to the Excel file (required)
- `--validate-only`: Only validate data without importing
- `--created-by <name>`: Name of the user performing the import (default: "DataMigrationTool")

## Data Processing

### Columns Added to Patient Table
- `SiteSpecificDiagnosis` - Detailed diagnosis from Excel
- `AgeAtDiagnosis` - Age at time of diagnosis
- `RegistrationYear` - Year from Excel data
- `SecondaryContactPhone` - Additional contact number
- `TertiaryContactPhone` - Third contact number
- `DateLoggedIn` - Date logged in system
- `ExcelSheetSource` - Source sheet name
- `ExcelRowNumber` - Original Excel row number
- `OriginalMRN` - Original MRN from Excel
- `ImportedFromExcel` - Flag indicating Excel import

### Data Cleaning Applied
- **Names**: Split into FirstName/LastName
- **Ages**: Parse "75yrs", "80 yrs" formats
- **Phone Numbers**: Clean and standardize format
- **Gender**: Map "M"/"F"/"male"/"female" to standard enum
- **Years**: Extract from various date formats
- **Cancer Sites**: Map sheet names to cancer site types
- **Stages**: Standardize cancer stage formats
- **Addresses**: Extract city/state information

### Cancer Site Mapping
- Breast → Breast
- Lung → Lung
- Colorectal → Colon
- Prostate → Prostate
- Cervix → Cervical
- Ovary → Ovarian
- Adult Leukemia → Blood
- Lymphoma → Blood
- Myeloma → Blood
- CNS tumors → Brain
- Renal cell carcinoma → Kidney
- HCC → Liver
- Pancreatio billiary → Pancreatic
- Stomach → Stomach
- Others → Other

## Expected Results

The Excel file contains approximately:
- **33 sheets** with different cancer types
- **~6,000+ patient records** total
- Records from **1996-2023** timeframe

### Sample Output
```
=== Import Results ===
Total Records: 6,234
Successful: 5,987
Skipped: 195
Errors: 52
Duration: 45.67 seconds

=== Errors ===
  Breast Row 15: Invalid age format: unknown
  Lung Row 234: Name is required
  ...
```

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check PostgreSQL is running
   - Verify connection string in appsettings.json
   - Ensure database exists

2. **Migration Errors**
   - Run `dotnet ef database update` from backend folder
   - Check Entity Framework logs

3. **Excel File Not Found**
   - Ensure correct path to Excel file
   - Check file permissions

4. **Memory Issues**
   - Large Excel files may need more memory
   - Process sheets individually if needed

### Validation Errors

Run with `--validate-only` first to identify data issues:
- Missing required fields (Name, MRN)
- Invalid age formats
- Invalid year formats
- Invalid gender values

## Output Files

The tool creates detailed logs showing:
- Processing progress for each sheet
- Data cleaning transformations
- Validation errors
- Import statistics
- Duplicate records skipped

## Database Impact

- **Indexes Created**: On OriginalMRN, ExcelSheetSource, ImportedFromExcel
- **Duplicate Handling**: Uses OriginalMRN to prevent duplicates
- **Transaction Safety**: Uses Entity Framework transactions
- **Audit Trail**: Maintains import metadata for each record

## Post-Import Verification

After successful import, you can verify:

1. **Check Record Count**:
   ```sql
   SELECT COUNT(*) FROM "Patients" WHERE "ImportedFromExcel" = true;
   ```

2. **Check by Sheet**:
   ```sql
   SELECT "ExcelSheetSource", COUNT(*) 
   FROM "Patients" 
   WHERE "ImportedFromExcel" = true 
   GROUP BY "ExcelSheetSource";
   ```

3. **Check Data Quality**:
   ```sql
   SELECT "ExcelSheetSource", "AgeAtDiagnosis", "RegistrationYear" 
   FROM "Patients" 
   WHERE "ImportedFromExcel" = true 
   LIMIT 10;
   ```