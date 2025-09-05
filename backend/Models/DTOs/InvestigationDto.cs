namespace PatientManagementApi.Models;

public class InvestigationDto
{
    public int Id { get; set; }
    public int PatientId { get; set; }
    public string PatientName { get; set; } = string.Empty;
    public string PatientCode { get; set; } = string.Empty;
    public string InvestigationType { get; set; } = string.Empty;
    public string InvestigationName { get; set; } = string.Empty;
    public DateTime OrderedDate { get; set; }
    public DateTime? ResultDate { get; set; }
    public string? ResultValue { get; set; }
    public string? NormalRange { get; set; }
    public string Status { get; set; } = string.Empty;
    public string Priority { get; set; } = string.Empty;
    public string? OrderedBy { get; set; }
    public string? OrderedByName { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class CreateInvestigationDto
{
    public int PatientId { get; set; }
    public string InvestigationType { get; set; } = string.Empty; // blood_test, imaging, pathology, etc.
    public string InvestigationName { get; set; } = string.Empty; // Complete Blood Count, CT Chest, etc.
    public DateTime OrderedDate { get; set; } = DateTime.Today;
    public DateTime? ResultDate { get; set; }
    public string? ResultValue { get; set; }
    public string? NormalRange { get; set; }
    public string Status { get; set; } = "pending"; // pending, completed, cancelled
    public string Priority { get; set; } = "routine"; // routine, urgent, stat
}

public class UpdateInvestigationDto : CreateInvestigationDto
{
    // All properties inherited from CreateInvestigationDto
}

public class InvestigationDetailDto : InvestigationDto
{
    // Additional details can be added here if needed in the future
}

public class InvestigationStatisticsDto
{
    public int TotalInvestigations { get; set; }
    public int PendingInvestigations { get; set; }
    public int CompletedInvestigations { get; set; }
    public int InvestigationsThisMonth { get; set; }
    public int UrgentInvestigations { get; set; }
    public List<InvestigationTypeCountDto> InvestigationsByType { get; set; } = new();
    public List<InvestigationStatusCountDto> InvestigationsByStatus { get; set; } = new();
    public List<InvestigationPriorityCountDto> InvestigationsByPriority { get; set; } = new();
}

public class InvestigationTypeCountDto
{
    public string InvestigationType { get; set; } = string.Empty;
    public int Count { get; set; }
}

public class InvestigationStatusCountDto
{
    public string Status { get; set; } = string.Empty;
    public int Count { get; set; }
}

public class InvestigationPriorityCountDto
{
    public string Priority { get; set; } = string.Empty;
    public int Count { get; set; }
}
