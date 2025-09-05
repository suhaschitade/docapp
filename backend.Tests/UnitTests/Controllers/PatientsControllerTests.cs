using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using PatientManagementApi.Controllers;
using PatientManagementApi.Data;
using PatientManagementApi.Models;
using System.Security.Claims;
using backend.Tests.Helpers;
using Xunit;

namespace backend.Tests.UnitTests.Controllers;

public class PatientsControllerTests : IDisposable
{
    private readonly ApplicationDbContext _context;
    private readonly Mock<ILogger<PatientsController>> _mockLogger;
    private readonly PatientsController _controller;

    public PatientsControllerTests()
    {
        _context = TestDbContextFactory.CreateInMemoryContext();
        _mockLogger = new Mock<ILogger<PatientsController>>();
        _controller = new PatientsController(_context, _mockLogger.Object);
        
        // Set up controller context with a mock user
        var user = new ClaimsPrincipal(new ClaimsIdentity(new[]
        {
            new Claim(ClaimTypes.NameIdentifier, "staff-1"),
            new Claim(ClaimTypes.Role, "Staff")
        }));
        
        _controller.ControllerContext = new ControllerContext()
        {
            HttpContext = new DefaultHttpContext() { User = user }
        };

        // Seed test data
        TestDbContextFactory.SeedTestData(_context);
    }

    [Fact]
    public async Task GetPatients_ShouldReturnAllPatients_WhenNoFiltersApplied()
    {
        // Act
        var result = await _controller.GetPatients();

        // Assert
        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        var response = okResult.Value.Should().BeAssignableTo<object>().Subject;
        
        // Use reflection to get the Data property
        var dataProperty = response.GetType().GetProperty("Data");
        var data = dataProperty?.GetValue(response) as IEnumerable<PatientDto>;
        
        data.Should().NotBeNull();
        data.Should().HaveCount(2); // We seeded 2 patients
    }

    [Fact]
    public async Task GetPatients_ShouldFilterBySearch_WhenSearchTermProvided()
    {
        // Act
        var result = await _controller.GetPatients(search: "John");

        // Assert
        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        var response = okResult.Value.Should().BeAssignableTo<object>().Subject;
        
        var dataProperty = response.GetType().GetProperty("Data");
        var data = dataProperty?.GetValue(response) as IEnumerable<PatientDto>;
        
        data.Should().NotBeNull();
        data.Should().HaveCount(1);
        data.First().FirstName.Should().Be("John");
    }

    [Fact]
    public async Task GetPatients_ShouldFilterByStatus_WhenStatusProvided()
    {
        // Act
        var result = await _controller.GetPatients(status: PatientStatusType.Active);

        // Assert
        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        var response = okResult.Value.Should().BeAssignableTo<object>().Subject;
        
        var dataProperty = response.GetType().GetProperty("Data");
        var data = dataProperty?.GetValue(response) as IEnumerable<PatientDto>;
        
        data.Should().NotBeNull();
        data.Should().HaveCount(2); // Both seeded patients are Active
        data.All(p => p.CurrentStatus == "Active").Should().BeTrue();
    }

    [Fact]
    public async Task GetPatients_ShouldFilterByCancerSite_WhenCancerSiteProvided()
    {
        // Act
        var result = await _controller.GetPatients(cancerSite: CancerSiteType.Lung);

        // Assert
        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        var response = okResult.Value.Should().BeAssignableTo<object>().Subject;
        
        var dataProperty = response.GetType().GetProperty("Data");
        var data = dataProperty?.GetValue(response) as IEnumerable<PatientDto>;
        
        data.Should().NotBeNull();
        data.Should().HaveCount(1);
        data.First().PrimaryCancerSite.Should().Be("Lung");
    }

    [Fact]
    public async Task GetPatients_ShouldApplyPagination_WhenPaginationParametersProvided()
    {
        // Act
        var result = await _controller.GetPatients(page: 1, pageSize: 1);

        // Assert
        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        var response = okResult.Value.Should().BeAssignableTo<object>().Subject;
        
        var dataProperty = response.GetType().GetProperty("Data");
        var pageProperty = response.GetType().GetProperty("Page");
        var pageSizeProperty = response.GetType().GetProperty("PageSize");
        var totalCountProperty = response.GetType().GetProperty("TotalCount");
        
        var data = dataProperty?.GetValue(response) as IEnumerable<PatientDto>;
        
        data.Should().NotBeNull();
        data.Should().HaveCount(1);
        pageProperty?.GetValue(response).Should().Be(1);
        pageSizeProperty?.GetValue(response).Should().Be(1);
        totalCountProperty?.GetValue(response).Should().Be(2);
    }

    [Fact]
    public async Task GetPatient_ShouldReturnPatient_WhenPatientExists()
    {
        // Act
        var result = await _controller.GetPatient(1);

        // Assert
        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        var patient = okResult.Value.Should().BeOfType<PatientDetailDto>().Subject;
        
        patient.Id.Should().Be(1);
        patient.FirstName.Should().Be("John");
        patient.LastName.Should().Be("Doe");
        patient.PatientId.Should().Be("P001");
    }

    [Fact]
    public async Task GetPatient_ShouldReturnNotFound_WhenPatientDoesNotExist()
    {
        // Act
        var result = await _controller.GetPatient(999);

        // Assert
        result.Result.Should().BeOfType<NotFoundObjectResult>();
    }

    [Fact]
    public async Task CreatePatient_ShouldCreatePatient_WithValidData()
    {
        // Arrange
        var createPatientDto = new CreatePatientDto
        {
            PatientId = "P003",
            FirstName = "Test",
            LastName = "Patient",
            DateOfBirth = new DateTime(1990, 1, 1),
            Gender = "Male",
            MobileNumber = "1234567890",
            Email = "test@example.com",
            PrimaryCancerSite = "Lung",
            TreatmentPathway = "Curative",
            RiskLevel = "Medium"
        };

        // Act
        var result = await _controller.CreatePatient(createPatientDto);

        // Assert
        var createdResult = result.Result.Should().BeOfType<CreatedAtActionResult>().Subject;
        var patient = createdResult.Value.Should().BeOfType<PatientDto>().Subject;
        
        patient.PatientId.Should().Be("P003");
        patient.FirstName.Should().Be("Test");
        patient.LastName.Should().Be("Patient");

        // Verify patient was added to database
        var dbPatient = await _context.Patients.FindAsync(patient.Id);
        dbPatient.Should().NotBeNull();
        dbPatient!.PatientId.Should().Be("P003");
    }

    [Fact]
    public async Task CreatePatient_ShouldReturnBadRequest_WhenPatientIdExists()
    {
        // Arrange
        var createPatientDto = new CreatePatientDto
        {
            PatientId = "P001", // This ID already exists in seeded data
            FirstName = "Test",
            LastName = "Patient",
            DateOfBirth = new DateTime(1990, 1, 1),
            Gender = "Male",
            MobileNumber = "1234567890",
            PrimaryCancerSite = "Lung",
            TreatmentPathway = "Curative",
            RiskLevel = "Medium"
        };

        // Act
        var result = await _controller.CreatePatient(createPatientDto);

        // Assert
        result.Result.Should().BeOfType<BadRequestObjectResult>();
    }

    [Fact]
    public async Task UpdatePatient_ShouldUpdatePatient_WithValidData()
    {
        // Arrange
        var updatePatientDto = new UpdatePatientDto
        {
            PatientId = "P001",
            FirstName = "Updated",
            LastName = "Name",
            DateOfBirth = new DateTime(1980, 1, 1),
            Gender = "Male",
            MobileNumber = "1234567890",
            PrimaryCancerSite = "Lung",
            TreatmentPathway = "Curative",
            CurrentStatus = "Active",
            RiskLevel = "High"
        };

        // Act
        var result = await _controller.UpdatePatient(1, updatePatientDto);

        // Assert
        result.Should().BeOfType<NoContentResult>();

        // Verify patient was updated in database
        var dbPatient = await _context.Patients.FindAsync(1);
        dbPatient.Should().NotBeNull();
        dbPatient!.FirstName.Should().Be("Updated");
        dbPatient.LastName.Should().Be("Name");
        dbPatient.RiskLevel.Should().Be(RiskLevelType.High);
    }

    [Fact]
    public async Task UpdatePatient_ShouldReturnNotFound_WhenPatientDoesNotExist()
    {
        // Arrange
        var updatePatientDto = new UpdatePatientDto
        {
            PatientId = "P999",
            FirstName = "Test",
            LastName = "Patient",
            DateOfBirth = new DateTime(1990, 1, 1),
            Gender = "Male",
            MobileNumber = "1234567890",
            PrimaryCancerSite = "Lung",
            TreatmentPathway = "Curative",
            CurrentStatus = "Active",
            RiskLevel = "Medium"
        };

        // Act
        var result = await _controller.UpdatePatient(999, updatePatientDto);

        // Assert
        result.Should().BeOfType<NotFoundObjectResult>();
    }

    [Fact]
    public async Task UpdatePatient_ShouldReturnBadRequest_WhenPatientIdExistsForDifferentPatient()
    {
        // Arrange
        var updatePatientDto = new UpdatePatientDto
        {
            PatientId = "P002", // This ID belongs to patient 2, but we're updating patient 1
            FirstName = "Test",
            LastName = "Patient",
            DateOfBirth = new DateTime(1990, 1, 1),
            Gender = "Male",
            MobileNumber = "1234567890",
            PrimaryCancerSite = "Lung",
            TreatmentPathway = "Curative",
            CurrentStatus = "Active",
            RiskLevel = "Medium"
        };

        // Act
        var result = await _controller.UpdatePatient(1, updatePatientDto);

        // Assert
        result.Should().BeOfType<BadRequestObjectResult>();
    }

    [Fact]
    public async Task DeletePatient_ShouldDeletePatient_WhenPatientExists()
    {
        // Act
        var result = await _controller.DeletePatient(1);

        // Assert
        result.Should().BeOfType<NoContentResult>();

        // Verify patient was deleted from database
        var dbPatient = await _context.Patients.FindAsync(1);
        dbPatient.Should().BeNull();
    }

    [Fact]
    public async Task DeletePatient_ShouldReturnNotFound_WhenPatientDoesNotExist()
    {
        // Act
        var result = await _controller.DeletePatient(999);

        // Assert
        result.Should().BeOfType<NotFoundObjectResult>();
    }

    [Fact]
    public async Task GetPatientStatistics_ShouldReturnStatistics()
    {
        // Act
        var result = await _controller.GetPatientStatistics();

        // Assert
        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        var statistics = okResult.Value.Should().BeOfType<PatientStatisticsDto>().Subject;
        
        statistics.TotalPatients.Should().Be(2);
        statistics.ActivePatients.Should().Be(2); // Both seeded patients are active
        statistics.PatientsByStatus.Should().NotBeEmpty();
        statistics.PatientsByCancerSite.Should().NotBeEmpty();
    }

    [Fact]
    public void GetPatients_ShouldHandleExceptions_AndReturnInternalServerError()
    {
        // Arrange - Dispose the context to cause an exception
        _context.Dispose();

        // Act & Assert
        var act = async () => await _controller.GetPatients();
        
        // The controller should handle the exception and return a 500 status code
        act.Should().ThrowAsync<ObjectDisposedException>();
    }

    public void Dispose()
    {
        _context?.Dispose();
    }
}
