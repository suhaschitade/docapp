using System.ComponentModel.DataAnnotations;

namespace PatientManagementApi.Models;

public class Patient
{
    public int Id { get; set; }
    
    [Required]
    [MaxLength(20)]
    public string PatientId { get; set; } = string.Empty; // Hospital patient ID
    
    [Required]
    [MaxLength(100)]
    public string FirstName { get; set; } = string.Empty;
    
    [Required]
    [MaxLength(100)]
    public string LastName { get; set; } = string.Empty;
    
    [Required]
    public int Age { get; set; }
    
    [Required]
    public Gender Gender { get; set; }
    
    [Required]
    [MaxLength(20)]
    public string MobileNumber { get; set; } = string.Empty;
    
    [EmailAddress]
    public string? Email { get; set; }
    
    public string? Address { get; set; }
    
    [MaxLength(100)]
    public string? City { get; set; }
    
    [MaxLength(100)]
    public string? State { get; set; }
    
    [MaxLength(20)]
    public string? PostalCode { get; set; }
    
    [MaxLength(100)]
    public string Country { get; set; } = "India";
    
    [MaxLength(200)]
    public string? EmergencyContactName { get; set; }
    
    [MaxLength(20)]
    public string? EmergencyContactPhone { get; set; }
    
    // Cancer specific information
    [Required]
    public CancerSiteType PrimaryCancerSite { get; set; }
    
    [MaxLength(10)]
    public string? CancerStage { get; set; }
    
    [MaxLength(200)]
    public string? Histology { get; set; }
    
    public DateTime? DiagnosisDate { get; set; }
    
    public TreatmentPathwayType TreatmentPathway { get; set; } = TreatmentPathwayType.Curative;
    
    // Status and risk
    public PatientStatusType CurrentStatus { get; set; } = PatientStatusType.Active;
    
    public RiskLevelType RiskLevel { get; set; } = RiskLevelType.Medium;
    
    // Tracking
    public string? AssignedDoctorId { get; set; }
    
    public DateTime RegistrationDate { get; set; } = DateTime.SpecifyKind(DateTime.Today, DateTimeKind.Utc);
    
    public DateTime? LastVisitDate { get; set; }
    
    public DateTime? NextFollowupDate { get; set; }
    
    // Excel import related fields
    [MaxLength(500)]
    public string? SiteSpecificDiagnosis { get; set; }
    
    
    public int? RegistrationYear { get; set; }
    
    [MaxLength(20)]
    public string? SecondaryContactPhone { get; set; }
    
    [MaxLength(20)]
    public string? TertiaryContactPhone { get; set; }
    
    public DateTime? DateLoggedIn { get; set; }
    
    [MaxLength(100)]
    public string? ExcelSheetSource { get; set; }
    
    public int? ExcelRowNumber { get; set; }
    
    [MaxLength(50)]
    public string? OriginalMRN { get; set; }
    
    public bool ImportedFromExcel { get; set; } = false;
    
    // Metadata
    public string? CreatedBy { get; set; }
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    
    // Navigation properties
    public virtual ApplicationUser? AssignedDoctor { get; set; }
    public virtual ApplicationUser? Creator { get; set; }
    public virtual ICollection<Appointment> Appointments { get; set; } = new List<Appointment>();
    public virtual ICollection<Treatment> Treatments { get; set; } = new List<Treatment>();
    public virtual ICollection<Investigation> Investigations { get; set; } = new List<Investigation>();
    public virtual ICollection<Notification> Notifications { get; set; } = new List<Notification>();
}

public enum Gender
{
    Male = 'M',
    Female = 'F',
    Other = 'O'
}

public enum CancerSiteType
{
    Lung,
    Breast,
    Kidney,
    Colon,
    Prostate,
    Cervical,
    Ovarian,
    Liver,
    Stomach,
    Pancreatic,
    Brain,
    Blood,
    Other
}

public enum TreatmentPathwayType
{
    Curative,
    Palliative
}

public enum PatientStatusType
{
    Active,
    Completed,
    Defaulter,
    LostToFollowup,
    Deceased
}

public enum RiskLevelType
{
    Low,
    Medium,
    High,
    Critical
}
