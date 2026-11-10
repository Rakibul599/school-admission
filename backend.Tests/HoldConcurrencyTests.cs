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

    /// <summary>
    /// Generates a valid 17-digit birth registration number (X-Student-Id)
    /// Prefix 2015269 (7 digits) + 10 random digits = exactly 17 digits.
    /// </summary>
    private static string GenerateUniqueStudentId()
    {
        var randomDigits = Random.Shared.NextInt64(1000000000L, 9999999999L);
        return $"2015269{randomDigits}";
    }

   
    // Test 1: Concurrency Validation (Pessimistic Locking Verification)
    // Ensures when 10 simultaneous requests compete for 1 available seat,
    // exactly 1 request succeeds and the remaining 9 receive 409 Conflict.
   
    [Fact]
    public async Task ConcurrentHolds_WhenOnlyOneSeatLeft_OnlyOneSucceeds()
    {
       
        // Arrange: Create an isolated class with exactly 1 total seat
        
        var classId = "test_class_" + Guid.NewGuid().ToString("N")[..8];

        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            db.Set<SchoolClass>().Add(new SchoolClass
            {
                Id = classId,
                Name = "Class 6 Morning Shift",
                TotalSeats = 1
            });
            await db.SaveChangesAsync();
        }

        var client = _factory.CreateClient();

        // Generate 10 distinct student IDs for parallel requests
        var studentIds = Enumerable.Range(1, 10)
            .Select(_ => GenerateUniqueStudentId())
            .ToList();

        
        // Act: Dispatch 10 parallel HTTP POST requests concurrently
        
        var tasks = studentIds.Select(async studentId =>
        {
            var request = new HttpRequestMessage(HttpMethod.Post, $"/classes/{classId}/holds");
            request.Headers.Add("X-Student-Id", studentId);
            return await client.SendAsync(request);
        });

        var responses = await Task.WhenAll(tasks);

        
        // Assert: Verify row-level lock prevented race conditions
        
        var successCount = responses.Count(r => r.StatusCode == HttpStatusCode.OK || r.StatusCode == HttpStatusCode.Created);
        var conflictCount = responses.Count(r => r.StatusCode == HttpStatusCode.Conflict);

        Assert.Equal(1, successCount);
        Assert.Equal(9, conflictCount);
    }

   
    // Test 2: Standard Seat Hold Flow
    // Verifies that a valid student request succeeds when seats are free.
   
    [Fact]
    public async Task CreateHold_WhenSeatsAvailable_ReturnsSuccess()
    {
        
        // Arrange: Create a class with multiple available seats
      
        var classId = "test_class_" + Guid.NewGuid().ToString("N")[..8];
        var studentId = GenerateUniqueStudentId();

        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            db.Set<SchoolClass>().Add(new SchoolClass
            {
                Id = classId,
                Name = "Class 7 Day Shift",
                TotalSeats = 5
            });
            await db.SaveChangesAsync();
        }

        var client = _factory.CreateClient();

        
        // Act: Submit hold request with student header
       
        var request = new HttpRequestMessage(HttpMethod.Post, $"/classes/{classId}/holds");
        request.Headers.Add("X-Student-Id", studentId);

        var response = await client.SendAsync(request);

        
        // Assert: Ensure request succeeds with 200 OK or 201 Created
       
        Assert.True(response.StatusCode == HttpStatusCode.OK || response.StatusCode == HttpStatusCode.Created);
    }

    
    // Test 3: Single Active Hold per Student Rule Validation
    // Verifies that the same student cannot hold multiple seats in one class.
   
    [Fact]
    public async Task CreateHold_SameStudentSecondAttempt_ReturnsConflict()
    {
       
        // Arrange: Create a class with available seats
    
        var classId = "test_class_" + Guid.NewGuid().ToString("N")[..8];
        var studentId = GenerateUniqueStudentId();

        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            db.Set<SchoolClass>().Add(new SchoolClass
            {
                Id = classId,
                Name = "Class 8 Morning Shift",
                TotalSeats = 10
            });
            await db.SaveChangesAsync();
        }

        var client = _factory.CreateClient();

       
        //  First hold attempt succeeds
        
        var firstRequest = new HttpRequestMessage(HttpMethod.Post, $"/classes/{classId}/holds");
        firstRequest.Headers.Add("X-Student-Id", studentId);
        var firstResponse = await client.SendAsync(firstRequest);
        Assert.True(firstResponse.StatusCode == HttpStatusCode.OK || firstResponse.StatusCode == HttpStatusCode.Created);

        
        //  Second hold attempt by the same student is rejected
        
        var secondRequest = new HttpRequestMessage(HttpMethod.Post, $"/classes/{classId}/holds");
        secondRequest.Headers.Add("X-Student-Id", studentId);
        var secondResponse = await client.SendAsync(secondRequest);

        Assert.Equal(HttpStatusCode.Conflict, secondResponse.StatusCode);
    }
}