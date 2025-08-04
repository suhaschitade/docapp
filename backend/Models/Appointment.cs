using System.ComponentModel.DataAnnotations;

namespace PatientManagementApi.Models;

public class Appointment
{
    public int Id { get; set; }
    
    [Required]
    public int PatientId { get; set; }
    
    public string? DoctorId { get; set; }
    
    [Required]
    public DateTime AppointmentDate { get; set; }
    
    [Required]
    public TimeOnly AppointmentTime { get; set; }
    
    [MaxLength(50)]
    public string AppointmentType { get; set; } = "follow-up";
    
    public AppointmentStatusType Status { get; set; } = AppointmentStatusType.Scheduled;
    
    public string? Notes { get; set; }
    
    public string? ConsultationNotes { get; set; }
    
    public DateTime? NextAppointmentDate { get; set; }
    
    // Missed appointment tracking
    public DateTime? MissedDate { get; set; }
    
    public string? MissedReason { get; set; }
    
    public bool FollowupAttempted { get; set; } = false;
    
    public DateTime? FollowupDate { get; set; }
    
    [MaxLength(50)]
    public string? FollowupMethod { get; set; } // phone, email, sms
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    
    // Navigation properties
    public virtual Patient Patient { get; set; } = null!;
    public virtual ApplicationUser? Doctor { get; set; }
}

public enum AppointmentStatusType
{
    Scheduled,
    Completed,
    Missed,
    Cancelled,
    Rescheduled
}
