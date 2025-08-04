using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using PatientManagementApi.Models;

namespace PatientManagementApi.Data;

public class ApplicationDbContext : IdentityDbContext<ApplicationUser>
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    // DbSets for all entities
    public DbSet<Patient> Patients { get; set; }
    public DbSet<Appointment> Appointments { get; set; }
    public DbSet<Treatment> Treatments { get; set; }
    public DbSet<Investigation> Investigations { get; set; }
    public DbSet<Notification> Notifications { get; set; }
    public DbSet<AnalyticsReport> AnalyticsReports { get; set; }
    public DbSet<AuditLog> AuditLogs { get; set; }

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        // Configure ApplicationUser
        builder.Entity<ApplicationUser>(entity =>
        {
            entity.Property(e => e.FirstName).HasMaxLength(100).IsRequired();
            entity.Property(e => e.LastName).HasMaxLength(100).IsRequired();
            entity.Property(e => e.Department).HasMaxLength(100);
            entity.Property(e => e.Specialization).HasMaxLength(100);
            entity.Property(e => e.LicenseNumber).HasMaxLength(50);
            entity.Property(e => e.IsActive).HasDefaultValue(true);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.Property(e => e.UpdatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
        });

        // Configure Patient
        builder.Entity<Patient>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.HasIndex(e => e.PatientId).IsUnique();
            entity.Property(e => e.Gender).HasConversion<string>();
            entity.Property(e => e.PrimaryCancerSite).HasConversion<string>();
            entity.Property(e => e.TreatmentPathway).HasConversion<string>();
            entity.Property(e => e.CurrentStatus).HasConversion<string>();
            entity.Property(e => e.RiskLevel).HasConversion<string>();
            entity.Property(e => e.Country).HasDefaultValue("India");
            entity.Property(e => e.RegistrationDate).HasDefaultValueSql("CURRENT_DATE");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.Property(e => e.UpdatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");

            // Foreign key relationships
            entity.HasOne(p => p.AssignedDoctor)
                  .WithMany(u => u.PatientsAssigned)
                  .HasForeignKey(p => p.AssignedDoctorId);

            entity.HasOne(p => p.Creator)
                  .WithMany(u => u.PatientsCreated)
                  .HasForeignKey(p => p.CreatedBy);
        });

        // Configure Appointment
        builder.Entity<Appointment>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.Status).HasConversion<string>();
            entity.Property(e => e.AppointmentType).HasDefaultValue("follow-up");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.Property(e => e.UpdatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");

            entity.HasOne(a => a.Patient)
                  .WithMany(p => p.Appointments)
                  .HasForeignKey(a => a.PatientId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(a => a.Doctor)
                  .WithMany(u => u.AppointmentsAsDoctor)
                  .HasForeignKey(a => a.DoctorId);
        });

        // Configure Treatment
        builder.Entity<Treatment>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.Status).HasDefaultValue("active");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.Property(e => e.UpdatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");

            entity.HasOne(t => t.Patient)
                  .WithMany(p => p.Treatments)
                  .HasForeignKey(t => t.PatientId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(t => t.Creator)
                  .WithMany(u => u.TreatmentsCreated)
                  .HasForeignKey(t => t.CreatedBy);
        });

        // Configure Investigation
        builder.Entity<Investigation>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.Status).HasDefaultValue("pending");
            entity.Property(e => e.Priority).HasDefaultValue("routine");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.Property(e => e.UpdatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");

            entity.HasOne(i => i.Patient)
                  .WithMany(p => p.Investigations)
                  .HasForeignKey(i => i.PatientId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(i => i.OrderedByUser)
                  .WithMany(u => u.InvestigationsOrdered)
                  .HasForeignKey(i => i.OrderedBy);
        });

        // Configure Notification
        builder.Entity<Notification>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.Priority).HasDefaultValue("medium");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");

            entity.HasOne(n => n.Patient)
                  .WithMany(p => p.Notifications)
                  .HasForeignKey(n => n.PatientId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(n => n.User)
                  .WithMany(u => u.Notifications)
                  .HasForeignKey(n => n.UserId);
        });

        // Configure AnalyticsReport
        builder.Entity<AnalyticsReport>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.GeneratedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");

            entity.HasOne(r => r.Generator)
                  .WithMany(u => u.ReportsGenerated)
                  .HasForeignKey(r => r.GeneratedBy);
        });

        // Configure AuditLog
        builder.Entity<AuditLog>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.ChangedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");

            entity.HasOne(a => a.ChangedByUser)
                  .WithMany(u => u.AuditLogs)
                  .HasForeignKey(a => a.ChangedBy);
        });

        // Indexes
        builder.Entity<Patient>()
               .HasIndex(p => p.PrimaryCancerSite);
        
        builder.Entity<Patient>()
               .HasIndex(p => p.CurrentStatus);
        
        builder.Entity<Patient>()
               .HasIndex(p => p.NextFollowupDate);

        builder.Entity<Appointment>()
               .HasIndex(a => a.AppointmentDate);
        
        builder.Entity<Appointment>()
               .HasIndex(a => a.Status);

        builder.Entity<Notification>()
               .HasIndex(n => new { n.UserId, n.IsRead });

        builder.Entity<AuditLog>()
               .HasIndex(a => new { a.TableName, a.RecordId });
    }

    // Override SaveChanges to handle UpdatedAt timestamps
    public override int SaveChanges()
    {
        UpdateTimestamps();
        return base.SaveChanges();
    }

    public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        UpdateTimestamps();
        return await base.SaveChangesAsync(cancellationToken);
    }

    private void UpdateTimestamps()
    {
        var entries = ChangeTracker.Entries()
            .Where(e => e.State == EntityState.Modified)
            .Where(e => e.Entity.GetType().GetProperty("UpdatedAt") != null);

        foreach (var entry in entries)
        {
            entry.Property("UpdatedAt").CurrentValue = DateTime.UtcNow;
        }
    }
}
