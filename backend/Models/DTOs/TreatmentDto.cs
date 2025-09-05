namespace PatientManagementApi.Models;

public class TreatmentDto
{
    public int Id { get; set; }
    public int PatientId { get; set; }
    public string PatientName { get; set; } = string.Empty;
    public string PatientCode { get; set; } = string.Empty;
    public string TreatmentType { get; set; } = string.Empty;
    public string? TreatmentName { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public string? Dosage { get; set; }
    public string? Frequency { get; set; }
    public string Status { get; set; } = string.Empty;
    public string? SideEffects { get; set; }
    public string? Response { get; set; }
    public string? CreatedBy { get; set; }
    public string? CreatedByName { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class CreateTreatmentDto
{
    public int PatientId { get; set; }
    public string TreatmentType { get; set; } = string.Empty; // chemotherapy, surgery, radiation
    public string? TreatmentName { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public string? Dosage { get; set; }
    public string? Frequency { get; set; }
    public string Status { get; set; } = "active"; // active, completed, cancelled
    public string? SideEffects { get; set; }
    public string? Response { get; set; } // good, partial, poor, unknown
}

public class UpdateTreatmentDto : CreateTreatmentDto
{
    // All properties inherited from CreateTreatmentDto
}

public class TreatmentDetailDto : TreatmentDto
{
    // Additional details can be added here if needed in the future
}

public class TreatmentStatisticsDto
{
    public int TotalTreatments { get; set; }
    public int ActiveTreatments { get; set; }
    public int CompletedTreatments { get; set; }
    public int TreatmentsThisMonth { get; set; }
    public List<TreatmentTypeCountDto> TreatmentsByType { get; set; } = new();
    public List<TreatmentStatusCountDto> TreatmentsByStatus { get; set; } = new();
}

public class TreatmentTypeCountDto
{
    public string TreatmentType { get; set; } = string.Empty;
    public int Count { get; set; }
}

public class TreatmentStatusCountDto
{
    public string Status { get; set; } = string.Empty;
    public int Count { get; set; }
}
