using PatientManagementApi.Services;

namespace PatientManagementApi.BackgroundServices;

public class NotificationBackgroundService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<NotificationBackgroundService> _logger;
    private readonly TimeSpan _period = TimeSpan.FromMinutes(5); // Run every 5 minutes (testing)

    public NotificationBackgroundService(
        IServiceProvider serviceProvider, 
        ILogger<NotificationBackgroundService> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Notification Background Service started");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await ProcessNotifications();
                await Task.Delay(_period, stoppingToken);
            }
            catch (OperationCanceledException)
            {
                _logger.LogInformation("Notification Background Service was cancelled");
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred in Notification Background Service");
                // Continue running even if there's an error
                await Task.Delay(TimeSpan.FromMinutes(5), stoppingToken); // Wait 5 minutes before retry
            }
        }

        _logger.LogInformation("Notification Background Service stopped");
    }

    private async Task ProcessNotifications()
    {
        using var scope = _serviceProvider.CreateScope();
        var notificationService = scope.ServiceProvider.GetRequiredService<INotificationService>();

        try
        {
            _logger.LogDebug("Starting notification processing cycle");

            // Process all notification checks sequentially to avoid DbContext concurrency issues
            await notificationService.CheckMissedAppointmentsAsync();
            await notificationService.CheckFollowUpsDueAsync();
            await notificationService.CheckInvestigationsDueAsync();
            await notificationService.ProcessScheduledNotificationsAsync();

            _logger.LogDebug("Completed notification processing cycle");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during notification processing");
            throw;
        }
    }

    public override async Task StopAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Notification Background Service is stopping");
        await base.StopAsync(stoppingToken);
    }
}
