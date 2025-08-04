using Microsoft.AspNetCore.Identity;

namespace PatientManagementApi.Models;

public class ApplicationUser : IdentityUser
{
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string? Department { get; set; }
    public string? Specialization { get; set; }
    public string? LicenseNumber { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public virtual ICollection<Patient> PatientsAssigned { get; set; } = new List<Patient>();
    public virtual ICollection<Patient> PatientsCreated { get; set; } = new List<Patient>();
    public virtual ICollection<Appointment> AppointmentsAsDoctor { get; set; } = new List<Appointment>();
    public virtual ICollection<Treatment> TreatmentsCreated { get; set; } = new List<Treatment>();
    public virtual ICollection<Investigation> InvestigationsOrdered { get; set; } = new List<Investigation>();
    public virtual ICollection<Notification> Notifications { get; set; } = new List<Notification>();
    public virtual ICollection<AnalyticsReport> ReportsGenerated { get; set; } = new List<AnalyticsReport>();
    public virtual ICollection<AuditLog> AuditLogs { get; set; } = new List<AuditLog>();
}
