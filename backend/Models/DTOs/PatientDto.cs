namespace PatientManagementApi.Models;

public class PatientDto
{
    public int Id { get; set; }
    public string PatientId { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public int Age { get; set; }
    public string Gender { get; set; } = string.Empty;
    public string MobileNumber { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string Address { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string State { get; set; } = string.Empty;
    public string PostalCode { get; set; } = string.Empty;
    public string Country { get; set; } = string.Empty;
    public string? EmergencyContactName { get; set; }
    public string? EmergencyContactPhone { get; set; }
    public string PrimaryCancerSite { get; set; } = string.Empty;
    public string? CancerStage { get; set; }
    public string? Histology { get; set; }
    public DateTime? DiagnosisDate { get; set; }
    public string TreatmentPathway { get; set; } = string.Empty;
    public string CurrentStatus { get; set; } = string.Empty;
    public string RiskLevel { get; set; } = string.Empty;
    public string? AssignedDoctorId { get; set; }
    public string? AssignedDoctorName { get; set; }
    public DateTime RegistrationDate { get; set; }
    public DateTime? LastVisitDate { get; set; }
    public DateTime? NextFollowupDate { get; set; }
    
    // Excel import related fields
    public string? SiteSpecificDiagnosis { get; set; }
    public int? RegistrationYear { get; set; }
    public string? SecondaryContactPhone { get; set; }
    public string? TertiaryContactPhone { get; set; }
    public DateTime? DateLoggedIn { get; set; }
    public string? ExcelSheetSource { get; set; }
    public int? ExcelRowNumber { get; set; }
    public string? OriginalMRN { get; set; }
    public bool ImportedFromExcel { get; set; }
    
    // Metadata
    public string? CreatedBy { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class PatientDetailDto : PatientDto
{
    public List<AppointmentSummaryDto> RecentAppointments { get; set; } = new();
    public List<TreatmentSummaryDto> CurrentTreatments { get; set; } = new();
    public List<InvestigationSummaryDto> PendingInvestigations { get; set; } = new();
}

public class CreatePatientDto
{
    public string PatientId { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public int Age { get; set; }
    public string Gender { get; set; } = string.Empty;
    public string MobileNumber { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string Address { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string State { get; set; } = string.Empty;
    public string PostalCode { get; set; } = string.Empty;
    public string? Country { get; set; }
    public string? EmergencyContactName { get; set; }
    public string? EmergencyContactPhone { get; set; }
    public string PrimaryCancerSite { get; set; } = string.Empty;
    public string? CancerStage { get; set; }
    public string? Histology { get; set; }
    public DateTime? DiagnosisDate { get; set; }
    public string TreatmentPathway { get; set; } = string.Empty;
    public string RiskLevel { get; set; } = string.Empty;
    public string? AssignedDoctorId { get; set; }
    public DateTime? NextFollowupDate { get; set; }
    
    // Additional fields
    public string? SiteSpecificDiagnosis { get; set; }
    public int? RegistrationYear { get; set; }
    public string? SecondaryContactPhone { get; set; }
    public string? TertiaryContactPhone { get; set; }
    public string? OriginalMRN { get; set; }
    public bool ImportedFromExcel { get; set; } = false;
}

public class UpdatePatientDto : CreatePatientDto
{
    public string CurrentStatus { get; set; } = string.Empty;
}

public class PatientStatisticsDto
{
    public int TotalPatients { get; set; }
    public int ActivePatients { get; set; }
    public int NewPatientsThisMonth { get; set; }
    public int HighRiskPatients { get; set; }
    public int OverdueFollowups { get; set; }
    public List<StatusCountDto> PatientsByStatus { get; set; } = new();
    public List<CancerSiteCountDto> PatientsByCancerSite { get; set; } = new();
}

public class StatusCountDto
{
    public string Status { get; set; } = string.Empty;
    public int Count { get; set; }
}

public class CancerSiteCountDto
{
    public string CancerSite { get; set; } = string.Empty;
    public int Count { get; set; }
}

public class AppointmentSummaryDto
{
    public int Id { get; set; }
    public DateTime AppointmentDate { get; set; }
    public TimeSpan AppointmentTime { get; set; }
    public string AppointmentType { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string? Notes { get; set; }
}

public class TreatmentSummaryDto
{
    public int Id { get; set; }
    public string TreatmentType { get; set; } = string.Empty;
    public string TreatmentName { get; set; } = string.Empty;
    public DateTime StartDate { get; set; }
    public string Status { get; set; } = string.Empty;
}

public class InvestigationSummaryDto
{
    public int Id { get; set; }
    public string InvestigationType { get; set; } = string.Empty;
    public string InvestigationName { get; set; } = string.Empty;
    public DateTime OrderedDate { get; set; }
    public string Status { get; set; } = string.Empty;
}
