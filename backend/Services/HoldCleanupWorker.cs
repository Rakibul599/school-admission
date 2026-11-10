using backend.Repositories;

namespace backend.Services;

public class HoldCleanupWorker : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<HoldCleanupWorker> _logger;

    public HoldCleanupWorker(IServiceProvider serviceProvider, ILogger<HoldCleanupWorker> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("HoldCleanupWorker started running.");

        // Periodic background execution every 15 seconds
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await CleanupExpiredHoldsAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while sweeping expired holds.");
            }

            await Task.Delay(TimeSpan.FromSeconds(15), stoppingToken);
        }
    }

    private async Task CleanupExpiredHoldsAsync()
    {
        // BackgroundService is singleton, so resolve scoped IHoldRepository within a scope
        using var scope = _serviceProvider.CreateScope();
        var holdRepository = scope.ServiceProvider.GetRequiredService<IHoldRepository>();

        var now = DateTime.UtcNow;
        var affectedRows = await holdRepository.MarkExpiredHoldsAsync(now);

        if (affectedRows > 0)
        {
            _logger.LogInformation("Cleaned up {Count} expired holds at {Time} UTC.", affectedRows, now);
        }
    }
}