using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PatientManagementApi.Data;
using PatientManagementApi.Models;
using System.Security.Claims;

namespace PatientManagementApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AppointmentsController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<AppointmentsController> _logger;

    public AppointmentsController(ApplicationDbContext context, ILogger<AppointmentsController> logger)
    {
        _context = context;
        _logger = logger;
    }

    // GET: api/appointments
    [HttpGet]
    public async Task<ActionResult<IEnumerable<AppointmentDto>>> GetAppointments(
        [FromQuery] DateTime? startDate = null,
        [FromQuery] DateTime? endDate = null,
        [FromQuery] string? doctorId = null,
        [FromQuery] int? patientId = null,
        [FromQuery] string? status = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50)
    {
        _logger.LogInformation("Retrieving appointments from {StartDate} to {EndDate} for doctor {DoctorId}", startDate, endDate, doctorId);
        try
        {
            var query = _context.Appointments
                .Include(a => a.Patient)
                .Include(a => a.Doctor)
                .AsQueryable();

            // Apply filters
            if (startDate.HasValue)
            {
                query = query.Where(a => a.AppointmentDate >= startDate.Value.ToUniversalTime().Date);
            }

            if (endDate.HasValue)
            {
                query = query.Where(a => a.AppointmentDate <= endDate.Value.ToUniversalTime().Date);
            }

            if (!string.IsNullOrEmpty(doctorId))
            {
                query = query.Where(a => a.DoctorId == doctorId);
            }

            if (patientId.HasValue)
            {
                query = query.Where(a => a.PatientId == patientId.Value);
            }

            if (!string.IsNullOrEmpty(status) && Enum.TryParse<AppointmentStatusType>(status, true, out var statusEnum))
            {
                query = query.Where(a => a.Status == statusEnum);
            }

            // Get total count for pagination
            var totalCount = await query.CountAsync();

            // Apply pagination and get results
            var appointments = await query
                .OrderBy(a => a.AppointmentDate)
                .ThenBy(a => a.AppointmentTime)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(a => new AppointmentDto
                {
                    Id = a.Id,
                    PatientId = a.PatientId,
                    PatientName = $"{a.Patient.FirstName} {a.Patient.LastName}",
                    DoctorId = a.DoctorId,
                    DoctorName = a.Doctor != null ? $"{a.Doctor.FirstName} {a.Doctor.LastName}" : null,
                    AppointmentDate = a.AppointmentDate,
                    AppointmentTime = a.AppointmentTime.ToTimeSpan(),
                    AppointmentType = a.AppointmentType,
                    Status = a.Status.ToString(),
                    Notes = a.Notes,
                    ConsultationNotes = a.ConsultationNotes,
                    NextAppointmentDate = a.NextAppointmentDate,
                    CreatedAt = a.CreatedAt,
                    UpdatedAt = a.UpdatedAt
                })
                .ToListAsync();

            var response = new
            {
                Data = appointments,
                TotalCount = totalCount,
                Page = page,
                PageSize = pageSize,
                TotalPages = (int)Math.Ceiling((double)totalCount / pageSize)
            };

            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving appointments");
            return StatusCode(500, "An error occurred while retrieving appointments");
        }
    }

    // GET: api/appointments/calendar
    [HttpGet("calendar")]
    public async Task<ActionResult<IEnumerable<AppointmentCalendarDto>>> GetAppointmentCalendar(
        [FromQuery] string? doctorId = null,
        [FromQuery] DateTime? startDate = null,
        [FromQuery] DateTime? endDate = null)
    {
        _logger.LogInformation("Retrieving appointment calendar from {StartDate} to {EndDate} for doctor {DoctorId}", startDate, endDate, doctorId);
        try
        {
var start = startDate?.ToUniversalTime() ?? DateTime.UtcNow;
var end = endDate?.ToUniversalTime() ?? DateTime.UtcNow.AddDays(30);

            var query = _context.Appointments
                .Include(a => a.Patient)
                .Where(a => a.AppointmentDate >= start && a.AppointmentDate <= end);

            if (!string.IsNullOrEmpty(doctorId))
            {
                query = query.Where(a => a.DoctorId == doctorId);
            }

            var appointments = await query
                .OrderBy(a => a.AppointmentDate)
                .ThenBy(a => a.AppointmentTime)
                .ToListAsync();

            var calendarData = appointments
                .GroupBy(a => a.AppointmentDate.Date)
                .Select(g => new AppointmentCalendarDto
                {
                    Date = g.Key,
                    Appointments = g.Select(a => new AppointmentTimeSlotDto
                    {
                        Id = a.Id,
                        PatientName = $"{a.Patient.FirstName} {a.Patient.LastName}",
                        Phone = a.Patient.MobileNumber,
                        Time = a.AppointmentTime.ToTimeSpan(),
                        Type = a.AppointmentType,
                        Status = a.Status.ToString().ToLower()
                    }).ToList()
                })
                .OrderBy(c => c.Date)
                .ToList();

            return Ok(calendarData);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving appointment calendar");
            return StatusCode(500, "An error occurred while retrieving the appointment calendar");
        }
    }

    // GET: api/appointments/{id}
    [HttpGet("{id}")]
    public async Task<ActionResult<AppointmentDto>> GetAppointment(int id)
    {
        _logger.LogInformation("Retrieving appointment {AppointmentId}", id);
        try
        {
            var appointment = await _context.Appointments
                .Include(a => a.Patient)
                .Include(a => a.Doctor)
                .FirstOrDefaultAsync(a => a.Id == id);

            if (appointment == null)
            {
                return NotFound($"Appointment with ID {id} not found");
            }

            var appointmentDto = new AppointmentDto
            {
                Id = appointment.Id,
                PatientId = appointment.PatientId,
                PatientName = $"{appointment.Patient.FirstName} {appointment.Patient.LastName}",
                DoctorId = appointment.DoctorId,
                DoctorName = appointment.Doctor != null ? $"{appointment.Doctor.FirstName} {appointment.Doctor.LastName}" : null,
                AppointmentDate = appointment.AppointmentDate,
                AppointmentTime = appointment.AppointmentTime.ToTimeSpan(),
                AppointmentType = appointment.AppointmentType,
                Status = appointment.Status.ToString(),
                Notes = appointment.Notes,
                ConsultationNotes = appointment.ConsultationNotes,
                NextAppointmentDate = appointment.NextAppointmentDate,
                CreatedAt = appointment.CreatedAt,
                UpdatedAt = appointment.UpdatedAt
            };

            return Ok(appointmentDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving appointment {AppointmentId}", id);
            return StatusCode(500, "An error occurred while retrieving the appointment");
        }
    }

    // POST: api/appointments
    [HttpPost]
    public async Task<ActionResult<AppointmentDto>> CreateAppointment(CreateAppointmentDto createAppointmentDto)
    {
        _logger.LogInformation("Creating appointment for patient {PatientId} with doctor {DoctorId}", createAppointmentDto.PatientId, createAppointmentDto.DoctorId);
        try
        {
            // Validate patient exists
            var patient = await _context.Patients.FindAsync(createAppointmentDto.PatientId);
            if (patient == null)
            {
                return BadRequest($"Patient with ID {createAppointmentDto.PatientId} not found");
            }

            // Check for appointment conflicts
            var conflictingAppointment = await _context.Appointments
                .AnyAsync(a => a.DoctorId == createAppointmentDto.DoctorId &&
                              a.AppointmentDate == createAppointmentDto.AppointmentDate &&
                              a.AppointmentTime == TimeOnly.FromTimeSpan(createAppointmentDto.AppointmentTime) &&
                              a.Status != AppointmentStatusType.Cancelled);

            if (conflictingAppointment)
            {
                return BadRequest("An appointment already exists for this doctor at the specified date and time");
            }

            var appointment = new Appointment
            {
                PatientId = createAppointmentDto.PatientId,
                DoctorId = createAppointmentDto.DoctorId,
                AppointmentDate = createAppointmentDto.AppointmentDate,
                AppointmentTime = TimeOnly.FromTimeSpan(createAppointmentDto.AppointmentTime),
                AppointmentType = createAppointmentDto.AppointmentType,
                Status = AppointmentStatusType.Scheduled,
                Notes = createAppointmentDto.Notes,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Appointments.Add(appointment);
            await _context.SaveChangesAsync();

            // Reload with navigation properties
            await _context.Entry(appointment)
                .Reference(a => a.Patient)
                .LoadAsync();
            
            if (!string.IsNullOrEmpty(appointment.DoctorId))
            {
                await _context.Entry(appointment)
                    .Reference(a => a.Doctor)
                    .LoadAsync();
            }

            var appointmentDto = new AppointmentDto
            {
                Id = appointment.Id,
                PatientId = appointment.PatientId,
                PatientName = $"{appointment.Patient.FirstName} {appointment.Patient.LastName}",
                DoctorId = appointment.DoctorId,
                DoctorName = appointment.Doctor != null ? $"{appointment.Doctor.FirstName} {appointment.Doctor.LastName}" : null,
                AppointmentDate = appointment.AppointmentDate,
                AppointmentTime = appointment.AppointmentTime.ToTimeSpan(),
                AppointmentType = appointment.AppointmentType,
                Status = appointment.Status.ToString(),
                Notes = appointment.Notes,
                ConsultationNotes = appointment.ConsultationNotes,
                NextAppointmentDate = appointment.NextAppointmentDate,
                CreatedAt = appointment.CreatedAt,
                UpdatedAt = appointment.UpdatedAt
            };

            return CreatedAtAction(nameof(GetAppointment), new { id = appointment.Id }, appointmentDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating appointment");
            return StatusCode(500, "An error occurred while creating the appointment");
        }
    }

    // POST: api/appointments/by-name
    [HttpPost("by-name")]
    public async Task<ActionResult<AppointmentDto>> CreateAppointmentByName(CreateAppointmentByNameDto createAppointmentDto)
    {
        _logger.LogInformation("Creating appointment by name for patient {PatientName} with phone {Phone} for doctor {DoctorId} on {Date} at {Time}", 
            createAppointmentDto.PatientName, createAppointmentDto.Phone, createAppointmentDto.DoctorId, createAppointmentDto.AppointmentDate, createAppointmentDto.AppointmentTime);
        try
        {
            // Try to find existing patient by name and phone
            var patient = await _context.Patients
                .FirstOrDefaultAsync(p => 
                    (p.FirstName + " " + p.LastName).ToLower().Contains(createAppointmentDto.PatientName.ToLower()) &&
                    p.MobileNumber == createAppointmentDto.Phone);

            // If patient not found, create a basic patient record
            if (patient == null)
            {
                var nameParts = createAppointmentDto.PatientName.Trim().Split(' ');
                var firstName = nameParts.FirstOrDefault() ?? "";
                var lastName = nameParts.Length > 1 ? string.Join(" ", nameParts.Skip(1)) : "";

                // Generate patient ID
                var lastPatient = await _context.Patients
                    .OrderByDescending(p => p.Id)
                    .FirstOrDefaultAsync();
                
                var nextPatientNumber = (lastPatient?.Id ?? 0) + 1;
                var patientId = $"P{nextPatientNumber:D3}";

                patient = new Patient
                {
                    PatientId = patientId,
                    FirstName = firstName,
                    LastName = lastName,
                    MobileNumber = createAppointmentDto.Phone,
                    DateOfBirth = DateTime.UtcNow.AddYears(-30), // Default age
                    Gender = Gender.Other,
                    PrimaryCancerSite = CancerSiteType.Other,
                    TreatmentPathway = TreatmentPathwayType.Curative,
                    CurrentStatus = PatientStatusType.Active,
                    RiskLevel = RiskLevelType.Medium,
                    RegistrationDate = DateTime.UtcNow,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                _context.Patients.Add(patient);
                await _context.SaveChangesAsync();
            }

            // Check for appointment conflicts
            var conflictingAppointment = await _context.Appointments
                .AnyAsync(a => a.DoctorId == createAppointmentDto.DoctorId &&
                              a.AppointmentDate == createAppointmentDto.AppointmentDate &&
                              a.AppointmentTime == TimeOnly.FromTimeSpan(createAppointmentDto.AppointmentTime) &&
                              a.Status != AppointmentStatusType.Cancelled);

            if (conflictingAppointment)
            {
                return BadRequest("An appointment already exists for this doctor at the specified date and time");
            }

            var appointment = new Appointment
            {
                PatientId = patient.Id,
                DoctorId = createAppointmentDto.DoctorId,
                AppointmentDate = createAppointmentDto.AppointmentDate,
                AppointmentTime = TimeOnly.FromTimeSpan(createAppointmentDto.AppointmentTime),
                AppointmentType = createAppointmentDto.AppointmentType,
                Status = AppointmentStatusType.Scheduled,
                Notes = createAppointmentDto.Notes,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Appointments.Add(appointment);
            await _context.SaveChangesAsync();

            // Reload with navigation properties
            await _context.Entry(appointment)
                .Reference(a => a.Patient)
                .LoadAsync();
            
            if (!string.IsNullOrEmpty(appointment.DoctorId))
            {
                await _context.Entry(appointment)
                    .Reference(a => a.Doctor)
                    .LoadAsync();
            }

            var appointmentDto = new AppointmentDto
            {
                Id = appointment.Id,
                PatientId = appointment.PatientId,
                PatientName = $"{appointment.Patient.FirstName} {appointment.Patient.LastName}",
                DoctorId = appointment.DoctorId,
                DoctorName = appointment.Doctor != null ? $"{appointment.Doctor.FirstName} {appointment.Doctor.LastName}" : null,
                AppointmentDate = appointment.AppointmentDate,
                AppointmentTime = appointment.AppointmentTime.ToTimeSpan(),
                AppointmentType = appointment.AppointmentType,
                Status = appointment.Status.ToString(),
                Notes = appointment.Notes,
                ConsultationNotes = appointment.ConsultationNotes,
                NextAppointmentDate = appointment.NextAppointmentDate,
                CreatedAt = appointment.CreatedAt,
                UpdatedAt = appointment.UpdatedAt
            };

            return CreatedAtAction(nameof(GetAppointment), new { id = appointment.Id }, appointmentDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating appointment by name");
            return StatusCode(500, "An error occurred while creating the appointment");
        }
    }

    // PUT: api/appointments/{id}
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateAppointment(int id, UpdateAppointmentDto updateAppointmentDto)
    {
        try
        {
            var appointment = await _context.Appointments.FindAsync(id);
            if (appointment == null)
            {
                return NotFound($"Appointment with ID {id} not found");
            }

            // Check for appointment conflicts (excluding current appointment)
            var conflictingAppointment = await _context.Appointments
                .AnyAsync(a => a.Id != id &&
                              a.DoctorId == appointment.DoctorId &&
                              a.AppointmentDate == updateAppointmentDto.AppointmentDate &&
                              a.AppointmentTime == TimeOnly.FromTimeSpan(updateAppointmentDto.AppointmentTime) &&
                              a.Status != AppointmentStatusType.Cancelled);

            if (conflictingAppointment)
            {
                return BadRequest("An appointment already exists for this doctor at the specified date and time");
            }

            // Update properties
            appointment.AppointmentDate = updateAppointmentDto.AppointmentDate;
            appointment.AppointmentTime = TimeOnly.FromTimeSpan(updateAppointmentDto.AppointmentTime);
            appointment.AppointmentType = updateAppointmentDto.AppointmentType;
            
            if (Enum.TryParse<AppointmentStatusType>(updateAppointmentDto.Status, true, out var status))
            {
                appointment.Status = status;
            }
            
            appointment.Notes = updateAppointmentDto.Notes;
            appointment.ConsultationNotes = updateAppointmentDto.ConsultationNotes;
            appointment.NextAppointmentDate = updateAppointmentDto.NextAppointmentDate;
            appointment.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating appointment {AppointmentId}", id);
            return StatusCode(500, "An error occurred while updating the appointment");
        }
    }

    // DELETE: api/appointments/{id}
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteAppointment(int id)
    {
        try
        {
            var appointment = await _context.Appointments.FindAsync(id);
            if (appointment == null)
            {
                return NotFound($"Appointment with ID {id} not found");
            }

            _context.Appointments.Remove(appointment);
            await _context.SaveChangesAsync();

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting appointment {AppointmentId}", id);
            return StatusCode(500, "An error occurred while deleting the appointment");
        }
    }

    // GET: api/appointments/statistics
    [HttpGet("statistics")]
    public async Task<ActionResult<AppointmentStatisticsDto>> GetAppointmentStatistics(
        [FromQuery] string? doctorId = null,
        [FromQuery] DateTime? startDate = null,
        [FromQuery] DateTime? endDate = null)
    {
        try
        {
            var start = startDate?.ToUniversalTime() ?? DateTime.UtcNow.AddDays(-30);
            var end = endDate?.ToUniversalTime() ?? DateTime.UtcNow.AddDays(30);

            var query = _context.Appointments.AsQueryable();

            if (!string.IsNullOrEmpty(doctorId))
            {
                query = query.Where(a => a.DoctorId == doctorId);
            }

            var statistics = new AppointmentStatisticsDto
            {
                TotalAppointments = await query.CountAsync(),
                TodayAppointments = await query.CountAsync(a => a.AppointmentDate.Date == DateTime.UtcNow.Date),
                CompletedAppointments = await query.CountAsync(a => a.Status == AppointmentStatusType.Completed),
                MissedAppointments = await query.CountAsync(a => a.Status == AppointmentStatusType.Missed),
                UpcomingAppointments = await query.CountAsync(a => 
                    a.AppointmentDate > DateTime.UtcNow && 
                    a.Status == AppointmentStatusType.Scheduled),
                DailyAppointments = await query
                    .Where(a => a.AppointmentDate >= start && a.AppointmentDate <= end)
                    .GroupBy(a => a.AppointmentDate.Date)
                    .Select(g => new DailyAppointmentCountDto
                    {
                        Date = g.Key,
                        Count = g.Count()
                    })
                    .OrderBy(d => d.Date)
                    .ToListAsync()
            };

            return Ok(statistics);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving appointment statistics");
            return StatusCode(500, "An error occurred while retrieving appointment statistics");
        }
    }
}
