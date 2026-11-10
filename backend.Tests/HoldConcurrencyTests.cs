using System.Net;
using System.Net.Http.Json;
using backend;
using backend.Data;
using backend.Models;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace backend.Tests;

public class HoldConcurrencyTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;

    public HoldConcurrencyTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task ConcurrentHolds_WhenOnlyOneSeatLeft_OnlyOneSucceeds()
    {
        
        // Arrange: Seed an isolated test class with only 1 total seat
       
        var classId = "test_class_" + Guid.NewGuid().ToString("N")[..8];

        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            db.Set<SchoolClass>().Add(new SchoolClass
            {
                Id = classId,
                Name = "Class 10 - Section A",
                TotalSeats = 1
            });
            await db.SaveChangesAsync();
        }

        var client = _factory.CreateClient();

        // Act: Fire 10 parallel hold requests from distinct students
      
        var studentIds = Enumerable.Range(1, 10)
            .Select(i => $"2015269{i:D10}")
            .ToList();

        var tasks = studentIds.Select(async studentId =>
        {
            var request = new HttpRequestMessage(HttpMethod.Post, $"/classes/{classId}/holds");
            request.Headers.Add("X-Student-Id", studentId);
            return await client.SendAsync(request);
        });

        // Await all concurrent tasks simultaneously to trigger race conditions
        var responses = await Task.WhenAll(tasks);

        
        // Assert: Ensure pessimistic lock prevents overbooking
        // Exactly 1 request acquires the hold, remaining 9 receive 409 Conflict
      
        var successCount = responses.Count(r => r.StatusCode == HttpStatusCode.OK || r.StatusCode == HttpStatusCode.Created);
        var conflictCount = responses.Count(r => r.StatusCode == HttpStatusCode.Conflict);

        Assert.Equal(1, successCount);
        Assert.Equal(9, conflictCount);
    }
}