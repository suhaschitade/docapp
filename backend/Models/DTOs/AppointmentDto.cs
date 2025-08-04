using System.ComponentModel.DataAnnotations;

namespace PatientManagementApi.Models;

public class AppointmentDto
{
    public int Id { get; set; }
    public int PatientId { get; set; }
    public string PatientName { get; set; } = string.Empty;
    public string? DoctorId { get; set; }
    public string? DoctorName { get; set; }
    public DateTime AppointmentDate { get; set; }
    public TimeSpan AppointmentTime { get; set; }
    public string AppointmentType { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string? Notes { get; set; }
    public string? ConsultationNotes { get; set; }
    public DateTime? NextAppointmentDate { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class CreateAppointmentDto
{
    [Required]
    public int PatientId { get; set; }
    
    public string? DoctorId { get; set; }
    
    [Required]
    public DateTime AppointmentDate { get; set; }
    
    [Required]
    public TimeSpan AppointmentTime { get; set; }
    
    [Required]
    [MaxLength(50)]
    public string AppointmentType { get; set; } = string.Empty;
    
    public string? Notes { get; set; }
}

public class CreateAppointmentByNameDto
{
    [Required]
    public string PatientName { get; set; } = string.Empty;
    
    [Required]
    public string Phone { get; set; } = string.Empty;
    
    public string? DoctorId { get; set; }
    
    [Required]
    public DateTime AppointmentDate { get; set; }
    
    [Required]
    public TimeSpan AppointmentTime { get; set; }
    
    [Required]
    [MaxLength(50)]
    public string AppointmentType { get; set; } = string.Empty;
    
    public string? Notes { get; set; }
}

public class UpdateAppointmentDto
{
    public DateTime AppointmentDate { get; set; }
    public TimeSpan AppointmentTime { get; set; }
    public string AppointmentType { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string? Notes { get; set; }
    public string? ConsultationNotes { get; set; }
    public DateTime? NextAppointmentDate { get; set; }
}

public class AppointmentCalendarDto
{
    public DateTime Date { get; set; }
    public List<AppointmentTimeSlotDto> Appointments { get; set; } = new();
}

public class AppointmentTimeSlotDto
{
    public int Id { get; set; }
    public string PatientName { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public TimeSpan Time { get; set; }
    public string Type { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
}

public class AppointmentStatisticsDto
{
    public int TotalAppointments { get; set; }
    public int TodayAppointments { get; set; }
    public int CompletedAppointments { get; set; }
    public int MissedAppointments { get; set; }
    public int UpcomingAppointments { get; set; }
    public List<DailyAppointmentCountDto> DailyAppointments { get; set; } = new();
}

public class DailyAppointmentCountDto
{
    public DateTime Date { get; set; }
    public int Count { get; set; }
}
