# Excel Data to Patient Table Mapping Analysis

## Current Patient Table Columns
Based on the database schema:
- Id (Primary Key)
- PatientId (Hospital ID)  
- FirstName
- LastName
- DateOfBirth
- Gender
- MobileNumber
- Email
- Address
- City
- State
- PostalCode
- Country
- EmergencyContactName
- EmergencyContactPhone
- PrimaryCancerSite
- CancerStage  
- Histology
- DiagnosisDate
- TreatmentPathway
- CurrentStatus
- RiskLevel
- AssignedDoctorId
- RegistrationDate
- LastVisitDate
- NextFollowupDate
- CreatedBy
- CreatedAt
- UpdatedAt

## Common Excel Columns Across Sheets
Most sheets contain these columns:
- SNo/Sno/Sl No (Row number)
- Name (Patient name)
- MRN No./MRN No/MH No (Medical Record Number)
- Year (Registration/diagnosis year)
- Diagnosis (Cancer type/diagnosis)
- Stage (Cancer stage - some sheets have this)
- Age (Patient age)
- Sex/Gender (Patient gender)
- Contact No/Contact No 1 (Phone number)
- Address (Patient address)
- Date logged in/Date Logged In (Some sheets)
- Contact No 2, Contact No 3 (Additional contacts in some sheets)

## Missing Columns in Patient Table
We need to add these columns:
1. **SiteSpecificDiagnosis** - Detailed diagnosis from sheets
2. **Age** - Age at diagnosis (we have DateOfBirth but not age)
3. **RegistrationYear** - Year from Excel data
4. **SecondaryContactPhone** - Contact No 2
5. **TertiaryContactPhone** - Contact No 3
6. **DateLoggedIn** - Date logged in system
7. **ExcelSheetSource** - Which sheet this data came from
8. **ExcelRowNumber** - Original row number in Excel
9. **OriginalMRN** - Original MRN from Excel

## Data Cleaning Requirements
1. **Name Splitting**: Excel has full names, need to split into FirstName/LastName
2. **Age Parsing**: Ages like "75yrs", "80 yrs" need cleaning
3. **Phone Number**: Clean phone numbers (some have spaces, dashes)
4. **Gender Mapping**: "M"/"F"/"male"/"female" -> standard format
5. **Address Parsing**: May need city/state extraction from address
6. **Cancer Site Mapping**: Map sheet names to PrimaryCancerSite enum values
7. **Stage Standardization**: Various stage formats need standardization

## Sheet to Cancer Site Mapping
- Breast -> breast
- Lung -> lung  
- Colorectal -> colon
- Prostate -> prostate
- Cervix -> cervical
- Ovary -> ovarian
- Stomach -> stomach
- Esophagus -> other
- Head & neck -> other
- Pancreatio billiary -> pancreatic
- Liver (HCC) -> liver
- Adult Leukemia -> blood
- Lymphoma -> blood
- Myeloma -> blood
- CNS tumors -> brain
- Sarcoma -> other
- Thyroid -> other
- Renal cell carcinoma -> kidney
- And more...

## Import Strategy
1. Add missing columns to Patient table via migration
2. Create import service that processes each sheet
3. Apply data cleaning rules during import
4. Handle duplicates by MRN
5. Log import results and errors
6. Create audit trail for imported data