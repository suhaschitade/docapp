using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PatientManagementApi.Services;

namespace PatientManagementApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin,Doctor")]
public class DebugController : ControllerBase
{
    private readonly INotificationService _notificationService;
    private readonly ILogger<DebugController> _logger;

    public DebugController(INotificationService notificationService, ILogger<DebugController> logger)
    {
        _notificationService = notificationService;
        _logger = logger;
    }

    [HttpPost("trigger-missed-appointments")]
    public async Task<IActionResult> TriggerMissedAppointmentCheck()
    {
        try
        {
            _logger.LogInformation("Debug: Manually triggering missed appointment check");
            await _notificationService.CheckMissedAppointmentsAsync();
            return Ok(new { message = "Missed appointment check completed successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during manual missed appointment check");
            return StatusCode(500, $"Error: {ex.Message}");
        }
    }

    [HttpPost("trigger-followups-due")]
    public async Task<IActionResult> TriggerFollowUpCheck()
    {
        try
        {
            _logger.LogInformation("Debug: Manually triggering follow-up due check");
            await _notificationService.CheckFollowUpsDueAsync();
            return Ok(new { message = "Follow-up due check completed successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during manual follow-up due check");
            return StatusCode(500, $"Error: {ex.Message}");
        }
    }

    [HttpPost("trigger-investigations-due")]
    public async Task<IActionResult> TriggerInvestigationsDueCheck()
    {
        try
        {
            _logger.LogInformation("Debug: Manually triggering investigations due check");
            await _notificationService.CheckInvestigationsDueAsync();
            return Ok(new { message = "Investigations due check completed successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during manual investigations due check");
            return StatusCode(500, $"Error: {ex.Message}");
        }
    }

    [HttpPost("trigger-all-notifications")]
    public async Task<IActionResult> TriggerAllNotificationChecks()
    {
        try
        {
            _logger.LogInformation("Debug: Manually triggering all notification checks");
            
            await _notificationService.CheckMissedAppointmentsAsync();
            await _notificationService.CheckFollowUpsDueAsync();
            await _notificationService.CheckInvestigationsDueAsync();
            await _notificationService.ProcessScheduledNotificationsAsync();
            
            return Ok(new { message = "All notification checks completed successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during manual notification checks");
            return StatusCode(500, $"Error: {ex.Message}");
        }
    }

    [HttpGet("background-service-status")]
    public IActionResult GetBackgroundServiceStatus()
    {
        try
        {
            var currentTime = DateTime.UtcNow;
            var nextRun = currentTime.AddMinutes(30 - (currentTime.Minute % 30));
            
            return Ok(new 
            { 
                message = "Background service information",
                currentTime = currentTime.ToString("yyyy-MM-dd HH:mm:ss UTC"),
                serviceInterval = "30 minutes",
                estimatedNextRun = nextRun.ToString("yyyy-MM-dd HH:mm:ss UTC"),
                serviceRegistered = true,
                lastLogMessage = "Check your console/terminal logs for background service activity"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting background service status");
            return StatusCode(500, $"Error: {ex.Message}");
        }
    }
}
