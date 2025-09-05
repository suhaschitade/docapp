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
public class NotificationsController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<NotificationsController> _logger;

    public NotificationsController(ApplicationDbContext context, ILogger<NotificationsController> logger)
    {
        _context = context;
        _logger = logger;
    }

    // GET: api/notifications
    [HttpGet]
    public async Task<ActionResult<IEnumerable<object>>> GetNotifications(
        [FromQuery] int page = 1, 
        [FromQuery] int pageSize = 20,
        [FromQuery] bool? isRead = null,
        [FromQuery] string? notificationType = null)
    {
        try
        {
            var currentUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(currentUserId))
            {
                return Unauthorized("User not authenticated");
            }

            // Check if user is Admin - if so, show all notifications
            var isAdmin = User.IsInRole("Admin");
            
            var query = _context.Notifications
                .Include(n => n.Patient)
                .AsQueryable();
            
            // If not admin, filter by user ID
            if (!isAdmin)
            {
                query = query.Where(n => n.UserId == currentUserId);
            }

            // Apply filters
            if (isRead.HasValue)
            {
                query = query.Where(n => n.IsRead == isRead.Value);
            }

            if (!string.IsNullOrEmpty(notificationType))
            {
                query = query.Where(n => n.NotificationType == notificationType);
            }

            // Get total count
            var totalCount = await query.CountAsync();

            // Apply pagination
            var notifications = await query
                .OrderByDescending(n => n.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(n => new
                {
                    n.Id,
                    n.PatientId,
                    PatientName = n.Patient != null ? $"{n.Patient.FirstName} {n.Patient.LastName}" : null,
                    PatientIdCode = n.Patient != null ? n.Patient.PatientId : null,
                    n.UserId,
                    n.NotificationType,
                    n.Title,
                    n.Message,
                    n.Priority,
                    n.IsRead,
                    n.SentVia,
                    n.ScheduledFor,
                    n.SentAt,
                    n.CreatedAt
                })
                .ToListAsync();

            return Ok(new
            {
                data = notifications,
                totalCount,
                page,
                pageSize,
                totalPages = (int)Math.Ceiling((double)totalCount / pageSize)
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving notifications for user {UserId}", User.Identity?.Name);
            return StatusCode(500, "An error occurred while retrieving notifications");
        }
    }

    // GET: api/notifications/{id}
    [HttpGet("{id}")]
    public async Task<ActionResult<object>> GetNotification(int id)
    {
        try
        {
            var currentUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(currentUserId))
            {
                return Unauthorized("User not authenticated");
            }

            // Check if user is Admin - if so, can view any notification
            var isAdmin = User.IsInRole("Admin");
            
            var query = _context.Notifications
                .Where(n => n.Id == id)
                .Include(n => n.Patient)
                .AsQueryable();
            
            // If not admin, filter by user ID
            if (!isAdmin)
            {
                query = query.Where(n => n.UserId == currentUserId);
            }
            
            var notification = await query
                .Select(n => new
                {
                    n.Id,
                    n.PatientId,
                    PatientName = n.Patient != null ? $"{n.Patient.FirstName} {n.Patient.LastName}" : null,
                    PatientIdCode = n.Patient != null ? n.Patient.PatientId : null,
                    n.UserId,
                    n.NotificationType,
                    n.Title,
                    n.Message,
                    n.Priority,
                    n.IsRead,
                    n.SentVia,
                    n.ScheduledFor,
                    n.SentAt,
                    n.CreatedAt
                })
                .FirstOrDefaultAsync();

            if (notification == null)
            {
                return NotFound($"Notification with ID {id} not found");
            }

            return Ok(notification);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving notification {NotificationId} for user {UserId}", id, User.Identity?.Name);
            return StatusCode(500, "An error occurred while retrieving the notification");
        }
    }

    // PUT: api/notifications/{id}/read
    [HttpPut("{id}/read")]
    public async Task<IActionResult> MarkAsRead(int id)
    {
        try
        {
            var currentUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(currentUserId))
            {
                return Unauthorized("User not authenticated");
            }

            var notification = await _context.Notifications
                .Where(n => n.Id == id && n.UserId == currentUserId)
                .FirstOrDefaultAsync();

            if (notification == null)
            {
                return NotFound($"Notification with ID {id} not found");
            }

            notification.IsRead = true;
            await _context.SaveChangesAsync();

            _logger.LogInformation("Notification {NotificationId} marked as read by user {UserId}", id, currentUserId);
            return Ok(new { message = "Notification marked as read" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error marking notification {NotificationId} as read for user {UserId}", id, User.Identity?.Name);
            return StatusCode(500, "An error occurred while marking the notification as read");
        }
    }

    // PUT: api/notifications/mark-all-read
    [HttpPut("mark-all-read")]
    public async Task<IActionResult> MarkAllAsRead()
    {
        try
        {
            var currentUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(currentUserId))
            {
                return Unauthorized("User not authenticated");
            }

            var unreadNotifications = await _context.Notifications
                .Where(n => n.UserId == currentUserId && !n.IsRead)
                .ToListAsync();

            foreach (var notification in unreadNotifications)
            {
                notification.IsRead = true;
            }

            await _context.SaveChangesAsync();

            _logger.LogInformation("All {Count} unread notifications marked as read by user {UserId}", unreadNotifications.Count, currentUserId);
            return Ok(new { message = $"{unreadNotifications.Count} notifications marked as read" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error marking all notifications as read for user {UserId}", User.Identity?.Name);
            return StatusCode(500, "An error occurred while marking notifications as read");
        }
    }

    // GET: api/notifications/unread-count
    [HttpGet("unread-count")]
    public async Task<ActionResult<object>> GetUnreadCount()
    {
        try
        {
            var currentUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(currentUserId))
            {
                return Unauthorized("User not authenticated");
            }

            // Check if user is Admin - if so, show count of all unread notifications
            var isAdmin = User.IsInRole("Admin");
            
            var query = _context.Notifications
                .Where(n => !n.IsRead)
                .AsQueryable();
            
            // If not admin, filter by user ID
            if (!isAdmin)
            {
                query = query.Where(n => n.UserId == currentUserId);
            }
            
            var unreadCount = await query.CountAsync();

            return Ok(new { unreadCount });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting unread count for user {UserId}", User.Identity?.Name);
            return StatusCode(500, "An error occurred while getting unread count");
        }
    }

    // POST: api/notifications (Admin only)
    [HttpPost]
    [Authorize(Roles = "Admin,Doctor")]
    public async Task<ActionResult<object>> CreateNotification([FromBody] CreateNotificationDto notificationDto)
    {
        try
        {
            var currentUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(currentUserId))
            {
                return Unauthorized("User not authenticated");
            }

            // Validate recipient user exists
            var recipientExists = await _context.Users
                .AnyAsync(u => u.Id == notificationDto.UserId);

            if (!recipientExists)
            {
                return BadRequest($"User with ID {notificationDto.UserId} does not exist");
            }

            // Validate patient exists if provided
            if (notificationDto.PatientId.HasValue)
            {
                var patientExists = await _context.Patients
                    .AnyAsync(p => p.Id == notificationDto.PatientId.Value);

                if (!patientExists)
                {
                    return BadRequest($"Patient with ID {notificationDto.PatientId} does not exist");
                }
            }

            var notification = new Notification
            {
                PatientId = notificationDto.PatientId,
                UserId = notificationDto.UserId,
                NotificationType = notificationDto.NotificationType,
                Title = notificationDto.Title,
                Message = notificationDto.Message,
                Priority = notificationDto.Priority ?? "medium",
                ScheduledFor = notificationDto.ScheduledFor,
                CreatedAt = DateTime.UtcNow
            };

            _context.Notifications.Add(notification);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Notification created by user {CreatorId} for user {RecipientId}", currentUserId, notificationDto.UserId);

            return CreatedAtAction(
                nameof(GetNotification), 
                new { id = notification.Id }, 
                new { 
                    id = notification.Id,
                    message = "Notification created successfully" 
                }
            );
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating notification by user {UserId}", User.Identity?.Name);
            return StatusCode(500, "An error occurred while creating the notification");
        }
    }

    // DELETE: api/notifications/{id}
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteNotification(int id)
    {
        try
        {
            var currentUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(currentUserId))
            {
                return Unauthorized("User not authenticated");
            }

            var notification = await _context.Notifications
                .Where(n => n.Id == id && n.UserId == currentUserId)
                .FirstOrDefaultAsync();

            if (notification == null)
            {
                return NotFound($"Notification with ID {id} not found");
            }

            _context.Notifications.Remove(notification);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Notification {NotificationId} deleted by user {UserId}", id, currentUserId);
            return Ok(new { message = "Notification deleted successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting notification {NotificationId} for user {UserId}", id, User.Identity?.Name);
            return StatusCode(500, "An error occurred while deleting the notification");
        }
    }

    // GET: api/notifications/types
    [HttpGet("types")]
    public ActionResult<object> GetNotificationTypes()
    {
        var notificationTypes = new[]
        {
            new { value = "missed_appointment", label = "Missed Appointment", description = "Patient missed scheduled appointment" },
            new { value = "followup_due", label = "Follow-up Due", description = "Patient follow-up appointment is due" },
            new { value = "investigation_due", label = "Investigation Due", description = "Patient investigation is pending" },
            new { value = "treatment_reminder", label = "Treatment Reminder", description = "Treatment schedule reminder" },
            new { value = "medication_reminder", label = "Medication Reminder", description = "Medication schedule reminder" },
            new { value = "appointment_confirmed", label = "Appointment Confirmed", description = "Appointment has been confirmed" },
            new { value = "appointment_cancelled", label = "Appointment Cancelled", description = "Appointment has been cancelled" },
            new { value = "test_result_ready", label = "Test Result Ready", description = "Test results are available" },
            new { value = "system_alert", label = "System Alert", description = "System maintenance or important updates" }
        };

        return Ok(notificationTypes);
    }
}

// DTOs
public class CreateNotificationDto
{
    public int? PatientId { get; set; }
    public required string UserId { get; set; }
    public required string NotificationType { get; set; }
    public required string Title { get; set; }
    public required string Message { get; set; }
    public string? Priority { get; set; } = "medium";
    public DateTime? ScheduledFor { get; set; }
}
