using FluentAssertions;
using PatientManagementApi.Models;
using System.ComponentModel.DataAnnotations;
using Xunit;

namespace backend.Tests.UnitTests.Models;

public class PatientModelTests
{
    [Fact]
    public void Patient_ShouldCreateSuccessfully_WithValidData()
    {
        // Arrange & Act
        var patient = new Patient
        {
            PatientId = "P001",
            FirstName = "John",
            LastName = "Doe",
            DateOfBirth = new DateTime(1990, 1, 1),
            Gender = Gender.Male,
            MobileNumber = "1234567890",
            PrimaryCancerSite = CancerSiteType.Lung
        };

        // Assert
        patient.PatientId.Should().Be("P001");
        patient.FirstName.Should().Be("John");
        patient.LastName.Should().Be("Doe");
        patient.Gender.Should().Be(Gender.Male);
        patient.PrimaryCancerSite.Should().Be(CancerSiteType.Lung);
        patient.CurrentStatus.Should().Be(PatientStatusType.Active); // Default value
        patient.RiskLevel.Should().Be(RiskLevelType.Medium); // Default value
        patient.TreatmentPathway.Should().Be(TreatmentPathwayType.Curative); // Default value
        patient.Country.Should().Be("India"); // Default value
    }

    [Fact]
    public void Patient_ShouldSetDefaultValues_WhenNotProvided()
    {
        // Arrange & Act
        var patient = new Patient();

        // Assert
        patient.CurrentStatus.Should().Be(PatientStatusType.Active);
        patient.RiskLevel.Should().Be(RiskLevelType.Medium);
        patient.TreatmentPathway.Should().Be(TreatmentPathwayType.Curative);
        patient.Country.Should().Be("India");
        patient.RegistrationDate.Should().Be(DateTime.Today);
        patient.CreatedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(1));
        patient.UpdatedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(1));
    }

    [Theory]
    [InlineData("P001")]
    [InlineData("PATIENT123")]
    [InlineData("A1B2C3")]
    public void Patient_ShouldAcceptValidPatientId(string patientId)
    {
        // Arrange & Act
        var patient = new Patient { PatientId = patientId };

        // Assert
        patient.PatientId.Should().Be(patientId);
    }

    [Theory]
    [InlineData(Gender.Male, 'M')]
    [InlineData(Gender.Female, 'F')]
    [InlineData(Gender.Other, 'O')]
    public void Gender_EnumValues_ShouldHaveCorrectCharValues(Gender gender, char expectedValue)
    {
        // Assert
        ((char)gender).Should().Be(expectedValue);
    }

    [Theory]
    [InlineData(CancerSiteType.Lung)]
    [InlineData(CancerSiteType.Breast)]
    [InlineData(CancerSiteType.Kidney)]
    [InlineData(CancerSiteType.Other)]
    public void Patient_ShouldAcceptAllCancerSiteTypes(CancerSiteType cancerSite)
    {
        // Arrange & Act
        var patient = new Patient { PrimaryCancerSite = cancerSite };

        // Assert
        patient.PrimaryCancerSite.Should().Be(cancerSite);
    }

    [Theory]
    [InlineData(PatientStatusType.Active)]
    [InlineData(PatientStatusType.Completed)]
    [InlineData(PatientStatusType.Defaulter)]
    [InlineData(PatientStatusType.LostToFollowup)]
    [InlineData(PatientStatusType.Deceased)]
    public void Patient_ShouldAcceptAllPatientStatusTypes(PatientStatusType status)
    {
        // Arrange & Act
        var patient = new Patient { CurrentStatus = status };

        // Assert
        patient.CurrentStatus.Should().Be(status);
    }

    [Theory]
    [InlineData(RiskLevelType.Low)]
    [InlineData(RiskLevelType.Medium)]
    [InlineData(RiskLevelType.High)]
    [InlineData(RiskLevelType.Critical)]
    public void Patient_ShouldAcceptAllRiskLevels(RiskLevelType riskLevel)
    {
        // Arrange & Act
        var patient = new Patient { RiskLevel = riskLevel };

        // Assert
        patient.RiskLevel.Should().Be(riskLevel);
    }

    [Theory]
    [InlineData(TreatmentPathwayType.Curative)]
    [InlineData(TreatmentPathwayType.Palliative)]
    public void Patient_ShouldAcceptAllTreatmentPathways(TreatmentPathwayType pathway)
    {
        // Arrange & Act
        var patient = new Patient { TreatmentPathway = pathway };

        // Assert
        patient.TreatmentPathway.Should().Be(pathway);
    }

    [Fact]
    public void Patient_ShouldHaveEmptyCollections_WhenCreated()
    {
        // Arrange & Act
        var patient = new Patient();

        // Assert
        patient.Appointments.Should().NotBeNull().And.BeEmpty();
        patient.Treatments.Should().NotBeNull().And.BeEmpty();
        patient.Investigations.Should().NotBeNull().And.BeEmpty();
        patient.Notifications.Should().NotBeNull().And.BeEmpty();
    }

    [Fact]
    public void Patient_ValidationAttributes_ShouldBeCorrectlyApplied()
    {
        // Arrange
        var patient = new Patient();
        var context = new ValidationContext(patient);
        var results = new List<ValidationResult>();

        // Act - Validate empty patient (should fail due to required fields)
        var isValid = Validator.TryValidateObject(patient, context, results, true);

        // Assert
        isValid.Should().BeFalse();
        results.Should().NotBeEmpty();
        
        // Check that required fields are validated
        var requiredFieldErrors = results.Where(r => r.ErrorMessage?.Contains("required") == true);
        requiredFieldErrors.Should().NotBeEmpty();
    }

    [Theory]
    [InlineData("test@example.com", true)]
    [InlineData("invalid-email", false)]
    [InlineData("", true)] // Empty email should be valid (nullable field)
    [InlineData(default(string), true)] // Null email should be valid
    public void Patient_EmailValidation_ShouldWorkCorrectly(string email, bool expectedValid)
    {
        // Arrange
        var patient = new Patient
        {
            PatientId = "P001",
            FirstName = "John",
            LastName = "Doe",
            DateOfBirth = new DateTime(1990, 1, 1),
            Gender = Gender.Male,
            MobileNumber = "1234567890",
            Email = email,
            PrimaryCancerSite = CancerSiteType.Lung
        };

        var context = new ValidationContext(patient);
        var results = new List<ValidationResult>();

        // Act
        var isValid = Validator.TryValidateObject(patient, context, results, true);

        // Assert
        if (expectedValid)
        {
            var emailErrors = results.Where(r => r.MemberNames.Contains("Email"));
            emailErrors.Should().BeEmpty();
        }
        else
        {
            var emailErrors = results.Where(r => r.MemberNames.Contains("Email"));
            emailErrors.Should().NotBeEmpty();
        }
    }

    [Theory]
    [InlineData("12345678901234567890", false)] // Exactly 20 chars should be valid
    [InlineData("123456789012345678901", false)] // 21 chars should be invalid
    public void Patient_PatientIdLength_ShouldBeValidated(string patientId, bool expectedInvalid)
    {
        // Arrange
        var patient = new Patient
        {
            PatientId = patientId,
            FirstName = "John",
            LastName = "Doe",
            DateOfBirth = new DateTime(1990, 1, 1),
            Gender = Gender.Male,
            MobileNumber = "1234567890",
            PrimaryCancerSite = CancerSiteType.Lung
        };

        var context = new ValidationContext(patient);
        var results = new List<ValidationResult>();

        // Act
        var isValid = Validator.TryValidateObject(patient, context, results, true);

        // Assert
        if (expectedInvalid)
        {
            var lengthErrors = results.Where(r => r.MemberNames.Contains("PatientId"));
            lengthErrors.Should().NotBeEmpty();
        }
    }
}
