using System.ComponentModel.DataAnnotations;

namespace PatientManagementApi.Models;

public class Treatment
{
    public int Id { get; set; }
    
    [Required]
    public int PatientId { get; set; }
    
    [Required]
    [MaxLength(100)]
    public string TreatmentType { get; set; } = string.Empty; // chemotherapy, surgery, radiation
    
    [MaxLength(200)]
    public string? TreatmentName { get; set; }
    
    public DateTime? StartDate { get; set; }
    
    public DateTime? EndDate { get; set; }
    
    [MaxLength(100)]
    public string? Dosage { get; set; }
    
    [MaxLength(100)]
    public string? Frequency { get; set; }
    
    [MaxLength(50)]
    public string Status { get; set; } = "active";
    
    public string? SideEffects { get; set; }
    
    [MaxLength(100)]
    public string? Response { get; set; }
    
    public string? CreatedBy { get; set; }
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    
    // Navigation properties
    public virtual Patient Patient { get; set; } = null!;
    public virtual ApplicationUser? Creator { get; set; }
}

public class Investigation
{
    public int Id { get; set; }
    
    [Required]
    public int PatientId { get; set; }
    
    [Required]
    [MaxLength(100)]
    public string InvestigationType { get; set; } = string.Empty;
    
    [Required]
    [MaxLength(200)]
    public string InvestigationName { get; set; } = string.Empty;
    
    [Required]
    public DateTime OrderedDate { get; set; }
    
    public DateTime? ResultDate { get; set; }
    
    [MaxLength(500)]
    public string? ResultValue { get; set; }
    
    [MaxLength(200)]
    public string? NormalRange { get; set; }
    
    [MaxLength(50)]
    public string Status { get; set; } = "pending"; // pending, completed, cancelled
    
    [MaxLength(20)]
    public string Priority { get; set; } = "routine"; // routine, urgent, stat
    
    public string? OrderedBy { get; set; }
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    
    // Navigation properties
    public virtual Patient Patient { get; set; } = null!;
    public virtual ApplicationUser? OrderedByUser { get; set; }
}

public class Notification
{
    public int Id { get; set; }
    
    public int? PatientId { get; set; }
    
    [Required]
    public string UserId { get; set; } = string.Empty; // recipient
    
    [Required]
    [MaxLength(50)]
    public string NotificationType { get; set; } = string.Empty; // missed_appointment, followup_due, investigation_due
    
    [Required]
    [MaxLength(200)]
    public string Title { get; set; } = string.Empty;
    
    [Required]
    public string Message { get; set; } = string.Empty;
    
    [MaxLength(20)]
    public string Priority { get; set; } = "medium";
    
    public bool IsRead { get; set; } = false;
    
    [MaxLength(50)]
    public string? SentVia { get; set; } // web, email, sms, push
    
    public DateTime? ScheduledFor { get; set; }
    
    public DateTime? SentAt { get; set; }
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    // Navigation properties
    public virtual Patient? Patient { get; set; }
    public virtual ApplicationUser User { get; set; } = null!;
}

public class AnalyticsReport
{
    public int Id { get; set; }
    
    [Required]
    [MaxLength(50)]
    public string ReportType { get; set; } = string.Empty; // weekly, monthly, yearly, custom
    
    [Required]
    [MaxLength(200)]
    public string ReportName { get; set; } = string.Empty;
    
    public string? GeneratedBy { get; set; }
    
    public string? Parameters { get; set; } // JSON string
    
    public string? ReportData { get; set; } // JSON string
    
    [MaxLength(500)]
    public string? FilePath { get; set; }
    
    public DateTime? StartDate { get; set; }
    
    public DateTime? EndDate { get; set; }
    
    public DateTime GeneratedAt { get; set; } = DateTime.UtcNow;
    
    // Navigation properties
    public virtual ApplicationUser? Generator { get; set; }
}

public class AuditLog
{
    public int Id { get; set; }
    
    [Required]
    [MaxLength(100)]
    public string TableName { get; set; } = string.Empty;
    
    [Required]
    public int RecordId { get; set; }
    
    [Required]
    [MaxLength(20)]
    public string Action { get; set; } = string.Empty; // INSERT, UPDATE, DELETE
    
    public string? OldValues { get; set; } // JSON string
    
    public string? NewValues { get; set; } // JSON string
    
    public string? ChangedBy { get; set; }
    
    public DateTime ChangedAt { get; set; } = DateTime.UtcNow;
    
    public string? IpAddress { get; set; }
    
    // Navigation properties
    public virtual ApplicationUser? ChangedByUser { get; set; }
}
