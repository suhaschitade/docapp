using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using PatientManagementApi.Data;
using PatientManagementApi.Models;

namespace backend.Tests.Helpers;

public static class TestDbContextFactory
{
    public static ApplicationDbContext CreateInMemoryContext(string? databaseName = null)
    {
        databaseName ??= Guid.NewGuid().ToString();
        
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName)
            .Options;

        var context = new ApplicationDbContext(options);
        
        // Ensure the database is created
        context.Database.EnsureCreated();
        
        return context;
    }
    
    public static void SeedTestData(ApplicationDbContext context)
    {
        // Add test users
        var testDoctor = new ApplicationUser
        {
            Id = "doctor-1",
            FirstName = "Test",
            LastName = "Doctor",
            UserName = "testdoctor@clinic.com",
            Email = "testdoctor@clinic.com",
            Department = "Oncology",
            Specialization = "Medical Oncology"
        };
        
        var testStaff = new ApplicationUser
        {
            Id = "staff-1",
            FirstName = "Test",
            LastName = "Staff",
            UserName = "teststaff@clinic.com",
            Email = "teststaff@clinic.com",
            Department = "Administration"
        };
        
        context.Users.AddRange(testDoctor, testStaff);

        // Add test patients
        var testPatients = new List<Patient>
        {
            new Patient
            {
                Id = 1,
                PatientId = "P001",
                FirstName = "John",
                LastName = "Doe",
                DateOfBirth = new DateTime(1980, 1, 1),
                Gender = Gender.Male,
                MobileNumber = "1234567890",
                Email = "john.doe@email.com",
                PrimaryCancerSite = CancerSiteType.Lung,
                CancerStage = "Stage II",
                CurrentStatus = PatientStatusType.Active,
                RiskLevel = RiskLevelType.Medium,
                AssignedDoctorId = "doctor-1",
                CreatedBy = "staff-1",
                CreatedAt = DateTime.UtcNow.AddDays(-10),
                UpdatedAt = DateTime.UtcNow.AddDays(-10)
            },
            new Patient
            {
                Id = 2,
                PatientId = "P002",
                FirstName = "Jane",
                LastName = "Smith",
                DateOfBirth = new DateTime(1975, 6, 15),
                Gender = Gender.Female,
                MobileNumber = "0987654321",
                Email = "jane.smith@email.com",
                PrimaryCancerSite = CancerSiteType.Breast,
                CancerStage = "Stage I",
                CurrentStatus = PatientStatusType.Active,
                RiskLevel = RiskLevelType.Low,
                AssignedDoctorId = "doctor-1",
                CreatedBy = "staff-1",
                CreatedAt = DateTime.UtcNow.AddDays(-5),
                UpdatedAt = DateTime.UtcNow.AddDays(-5)
            }
        };
        
        context.Patients.AddRange(testPatients);
        context.SaveChanges();
    }
    
    public static Patient CreateTestPatient(string patientId = "TEST001", string doctorId = "doctor-1")
    {
        return new Patient
        {
            PatientId = patientId,
            FirstName = "Test",
            LastName = "Patient",
            DateOfBirth = new DateTime(1990, 1, 1),
            Gender = Gender.Male,
            MobileNumber = "1234567890",
            Email = "test.patient@email.com",
            Address = "123 Test St",
            City = "Test City",
            State = "Test State",
            PostalCode = "12345",
            Country = "India",
            EmergencyContactName = "Emergency Contact",
            EmergencyContactPhone = "0987654321",
            PrimaryCancerSite = CancerSiteType.Lung,
            CancerStage = "Stage I",
            Histology = "Test Histology",
            DiagnosisDate = DateTime.UtcNow.AddDays(-30),
            TreatmentPathway = TreatmentPathwayType.Curative,
            CurrentStatus = PatientStatusType.Active,
            RiskLevel = RiskLevelType.Medium,
            AssignedDoctorId = doctorId,
            RegistrationDate = DateTime.Today,
            NextFollowupDate = DateTime.Today.AddDays(30),
            CreatedBy = "staff-1",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
    }
}
