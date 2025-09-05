using Microsoft.EntityFrameworkCore;
using PatientManagementApi.Data;
using PatientManagementApi.Models;

namespace PatientManagementApi.Services;

public interface INotificationService
{
    Task SendNotificationAsync(string userId, string notificationType, string title, string message, int? patientId = null, string priority = "medium");
    Task CheckMissedAppointmentsAsync();
    Task CheckFollowUpsDueAsync();
    Task CheckInvestigationsDueAsync();
    Task ProcessScheduledNotificationsAsync();
    Task<int> GetUnreadCountAsync(string userId);
}

public class NotificationService : INotificationService
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<NotificationService> _logger;
    private readonly IConfiguration _configuration;

    public NotificationService(
        ApplicationDbContext context, 
        ILogger<NotificationService> logger,
        IConfiguration configuration)
    {
        _context = context;
        _logger = logger;
        _configuration = configuration;
    }

    public async Task SendNotificationAsync(string userId, string notificationType, string title, string message, int? patientId = null, string priority = "medium")
    {
        try
        {
            var notification = new Notification
            {
                UserId = userId,
                PatientId = patientId,
                NotificationType = notificationType,
                Title = title,
                Message = message,
                Priority = priority,
                SentVia = "web",
                SentAt = DateTime.UtcNow,
                CreatedAt = DateTime.UtcNow
            };

            _context.Notifications.Add(notification);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Notification sent to user {UserId}: {Title}", userId, title);

            // TODO: Implement additional notification channels
            await SendEmailNotificationAsync(notification);
            await SendPushNotificationAsync(notification);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending notification to user {UserId}", userId);
            throw;
        }
    }

    public async Task CheckMissedAppointmentsAsync()
    {
        try
        {
            _logger.LogInformation("Checking for missed appointments...");

            var yesterday = DateTime.UtcNow.Date.AddDays(-1);
            
            var missedAppointments = await _context.Appointments
                .Include(a => a.Patient)
                .Include(a => a.Doctor)
                .Where(a => a.AppointmentDate.Date == yesterday && 
                           (a.Status == AppointmentStatusType.Scheduled))
                .ToListAsync();

            foreach (var appointment in missedAppointments)
            {
                // Mark appointment as missed
                appointment.Status = AppointmentStatusType.Missed;
                
                // Notify doctor if assigned
                if (!string.IsNullOrEmpty(appointment.DoctorId))
                {
                    await SendNotificationAsync(
                        appointment.DoctorId,
                        "missed_appointment",
                        "Missed Appointment Alert",
                        $"Patient {appointment.Patient.FirstName} {appointment.Patient.LastName} ({appointment.Patient.PatientId}) missed appointment scheduled for {appointment.AppointmentDate:yyyy-MM-dd} at {appointment.AppointmentTime}.",
                        appointment.PatientId,
                        "high"
                    );
                }

                // Notify assigned doctor for patient follow-up
                if (appointment.Patient?.AssignedDoctorId != null && 
                    appointment.Patient.AssignedDoctorId != appointment.DoctorId)
                {
                    await SendNotificationAsync(
                        appointment.Patient.AssignedDoctorId,
                        "missed_appointment",
                        "Patient Missed Appointment",
                        $"Your patient {appointment.Patient.FirstName} {appointment.Patient.LastName} ({appointment.Patient.PatientId}) missed an appointment. Please follow up.",
                        appointment.PatientId,
                        "medium"
                    );
                }
            }

            await _context.SaveChangesAsync();
            _logger.LogInformation("Processed {Count} missed appointments", missedAppointments.Count);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking missed appointments");
            throw;
        }
    }

    public async Task CheckFollowUpsDueAsync()
    {
        try
        {
            _logger.LogInformation("Checking for follow-ups due...");

            var today = DateTime.UtcNow.Date;
            var nextWeek = today.AddDays(7);

            var patientsWithFollowUpsDue = await _context.Patients
                .Include(p => p.AssignedDoctor)
                .Where(p => p.NextFollowupDate.HasValue && 
                           p.NextFollowupDate.Value.Date >= today && 
                           p.NextFollowupDate.Value.Date <= nextWeek &&
                           p.AssignedDoctorId != null)
                .ToListAsync();

            foreach (var patient in patientsWithFollowUpsDue)
            {
                var daysUntilFollowUp = (patient.NextFollowupDate!.Value.Date - today).Days;
                var urgency = daysUntilFollowUp <= 3 ? "high" : "medium";

                await SendNotificationAsync(
                    patient.AssignedDoctorId!,
                    "followup_due",
                    "Follow-up Due",
                    $"Patient {patient.FirstName} {patient.LastName} ({patient.PatientId}) has a follow-up due on {patient.NextFollowupDate:yyyy-MM-dd} ({daysUntilFollowUp} days from now).",
                    patient.Id,
                    urgency
                );
            }

            _logger.LogInformation("Processed {Count} follow-up reminders", patientsWithFollowUpsDue.Count);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking follow-ups due");
            throw;
        }
    }

    public async Task CheckInvestigationsDueAsync()
    {
        try
        {
            _logger.LogInformation("Checking for overdue investigations...");

            var today = DateTime.UtcNow.Date;
            var overdueDate = today.AddDays(-3); // Consider overdue after 3 days

            var overdueInvestigations = await _context.Investigations
                .Include(i => i.Patient)
                .ThenInclude(p => p.AssignedDoctor)
                .Include(i => i.OrderedByUser)
                .Where(i => i.Status == "pending" && 
                           i.OrderedDate.Date <= overdueDate)
                .ToListAsync();

            foreach (var investigation in overdueInvestigations)
            {
                var daysOverdue = (today - investigation.OrderedDate.Date).Days;
                
                // Notify the doctor who ordered the investigation
                if (!string.IsNullOrEmpty(investigation.OrderedBy))
                {
                    await SendNotificationAsync(
                        investigation.OrderedBy,
                        "investigation_due",
                        "Investigation Overdue",
                        $"Investigation '{investigation.InvestigationName}' for patient {investigation.Patient.FirstName} {investigation.Patient.LastName} ({investigation.Patient.PatientId}) is {daysOverdue} days overdue.",
                        investigation.PatientId,
                        investigation.Priority == "stat" || investigation.Priority == "urgent" ? "high" : "medium"
                    );
                }

                // Also notify assigned doctor if different
                if (!string.IsNullOrEmpty(investigation.Patient.AssignedDoctorId) && 
                    investigation.Patient.AssignedDoctorId != investigation.OrderedBy)
                {
                    await SendNotificationAsync(
                        investigation.Patient.AssignedDoctorId,
                        "investigation_due",
                        "Patient Investigation Overdue",
                        $"Your patient {investigation.Patient.FirstName} {investigation.Patient.LastName} ({investigation.Patient.PatientId}) has an overdue investigation: '{investigation.InvestigationName}' ({daysOverdue} days overdue).",
                        investigation.PatientId,
                        "medium"
                    );
                }
            }

            _logger.LogInformation("Processed {Count} overdue investigation alerts", overdueInvestigations.Count);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking investigations due");
            throw;
        }
    }

    public async Task ProcessScheduledNotificationsAsync()
    {
        try
        {
            _logger.LogInformation("Processing scheduled notifications...");

            var now = DateTime.UtcNow;
            var scheduledNotifications = await _context.Notifications
                .Where(n => n.ScheduledFor.HasValue && 
                           n.ScheduledFor.Value <= now && 
                           !n.SentAt.HasValue)
                .ToListAsync();

            foreach (var notification in scheduledNotifications)
            {
                notification.SentAt = now;
                notification.SentVia = "web";
                
                // TODO: Send via additional channels (email, push, SMS)
                await SendEmailNotificationAsync(notification);
                await SendPushNotificationAsync(notification);
            }

            await _context.SaveChangesAsync();
            _logger.LogInformation("Processed {Count} scheduled notifications", scheduledNotifications.Count);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing scheduled notifications");
            throw;
        }
    }

    public async Task<int> GetUnreadCountAsync(string userId)
    {
        return await _context.Notifications
            .Where(n => n.UserId == userId && !n.IsRead)
            .CountAsync();
    }

    // Email notification implementation
    private async Task SendEmailNotificationAsync(Notification notification)
    {
        try
        {
            var enableEmailNotifications = _configuration.GetValue<bool>("NotificationSettings:EnableEmailNotifications");
            if (!enableEmailNotifications)
            {
                return;
            }

            // Get user email
            var user = await _context.Users
                .Where(u => u.Id == notification.UserId)
                .FirstOrDefaultAsync();

            if (user?.Email == null)
            {
                _logger.LogWarning("Cannot send email notification - user {UserId} has no email", notification.UserId);
                return;
            }

            // TODO: Implement actual email sending logic
            // This could use SendGrid, SMTP, or other email services
            _logger.LogInformation("Email notification would be sent to {Email}: {Title}", user.Email, notification.Title);
            
            // Example implementation:
            // await _emailService.SendAsync(user.Email, notification.Title, notification.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending email notification for notification {NotificationId}", notification.Id);
        }
    }

    // Push notification implementation  
    private async Task SendPushNotificationAsync(Notification notification)
    {
        try
        {
            var enablePushNotifications = _configuration.GetValue<bool>("NotificationSettings:EnablePushNotifications");
            if (!enablePushNotifications)
            {
                return;
            }

            // TODO: Implement actual push notification logic
            // This would integrate with Web Push API, Firebase, or other push services
            _logger.LogInformation("Push notification would be sent to user {UserId}: {Title}", notification.UserId, notification.Title);
            
            // Example implementation:
            // await _pushService.SendAsync(notification.UserId, notification.Title, notification.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending push notification for notification {NotificationId}", notification.Id);
        }
    }
}
