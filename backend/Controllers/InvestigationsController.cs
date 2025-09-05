using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PatientManagementApi.Data;
using PatientManagementApi.Models;
using System.Security.Claims;

namespace PatientManagementApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Doctor,Nurse,Staff,Admin")] // All medical roles can manage investigations
public class InvestigationsController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<InvestigationsController> _logger;

    public InvestigationsController(ApplicationDbContext context, ILogger<InvestigationsController> logger)
    {
        _context = context;
        _logger = logger;
    }

    // GET: api/investigations
    [HttpGet]
    public async Task<ActionResult<IEnumerable<InvestigationDto>>> GetInvestigations(
        [FromQuery] int? patientId = null,
        [FromQuery] string? investigationType = null,
        [FromQuery] string? status = null,
        [FromQuery] string? priority = null,
        [FromQuery] string? search = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10)
    {
        try
        {
            var query = _context.Investigations
                .Include(i => i.Patient)
                .Include(i => i.OrderedByUser)
                .AsQueryable();

            // Apply filters
            if (patientId.HasValue)
            {
                query = query.Where(i => i.PatientId == patientId.Value);
            }

            if (!string.IsNullOrEmpty(investigationType))
            {
                query = query.Where(i => i.InvestigationType.Contains(investigationType));
            }

            if (!string.IsNullOrEmpty(status))
            {
                query = query.Where(i => i.Status == status);
            }

            if (!string.IsNullOrEmpty(priority))
            {
                query = query.Where(i => i.Priority == priority);
            }

            if (!string.IsNullOrEmpty(search))
            {
                query = query.Where(i =>
                    i.InvestigationType.Contains(search) ||
                    i.InvestigationName.Contains(search) ||
                    i.Patient.FirstName.Contains(search) ||
                    i.Patient.LastName.Contains(search) ||
                    i.Patient.PatientId.Contains(search));
            }

            // Get total count for pagination
            var totalCount = await query.CountAsync();

            // Apply pagination and select DTOs
            var investigations = await query
                .OrderByDescending(i => i.OrderedDate)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(i => new InvestigationDto
                {
                    Id = i.Id,
                    PatientId = i.PatientId,
                    PatientName = $"{i.Patient.FirstName} {i.Patient.LastName}",
                    PatientCode = i.Patient.PatientId,
                    InvestigationType = i.InvestigationType,
                    InvestigationName = i.InvestigationName,
                    OrderedDate = i.OrderedDate,
                    ResultDate = i.ResultDate,
                    ResultValue = i.ResultValue,
                    NormalRange = i.NormalRange,
                    Status = i.Status,
                    Priority = i.Priority,
                    OrderedBy = i.OrderedBy,
                    OrderedByName = i.OrderedByUser != null ? $"{i.OrderedByUser.FirstName} {i.OrderedByUser.LastName}" : null,
                    CreatedAt = i.CreatedAt,
                    UpdatedAt = i.UpdatedAt
                })
                .ToListAsync();

            var response = new
            {
                Data = investigations,
                TotalCount = totalCount,
                Page = page,
                PageSize = pageSize,
                TotalPages = (int)Math.Ceiling((double)totalCount / pageSize)
            };

            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving investigations");
            return StatusCode(500, "An error occurred while retrieving investigations");
        }
    }

    // GET: api/investigations/{id}
    [HttpGet("{id}")]
    public async Task<ActionResult<InvestigationDetailDto>> GetInvestigation(int id)
    {
        try
        {
            var investigation = await _context.Investigations
                .Include(i => i.Patient)
                .Include(i => i.OrderedByUser)
                .FirstOrDefaultAsync(i => i.Id == id);

            if (investigation == null)
            {
                return NotFound($"Investigation with ID {id} not found");
            }

            var investigationDetail = new InvestigationDetailDto
            {
                Id = investigation.Id,
                PatientId = investigation.PatientId,
                PatientName = $"{investigation.Patient.FirstName} {investigation.Patient.LastName}",
                PatientCode = investigation.Patient.PatientId,
                InvestigationType = investigation.InvestigationType,
                InvestigationName = investigation.InvestigationName,
                OrderedDate = investigation.OrderedDate,
                ResultDate = investigation.ResultDate,
                ResultValue = investigation.ResultValue,
                NormalRange = investigation.NormalRange,
                Status = investigation.Status,
                Priority = investigation.Priority,
                OrderedBy = investigation.OrderedBy,
                OrderedByName = investigation.OrderedByUser != null ? $"{investigation.OrderedByUser.FirstName} {investigation.OrderedByUser.LastName}" : null,
                CreatedAt = investigation.CreatedAt,
                UpdatedAt = investigation.UpdatedAt
            };

            return Ok(investigationDetail);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving investigation {InvestigationId}", id);
            return StatusCode(500, "An error occurred while retrieving the investigation");
        }
    }

    // GET: api/investigations/patient/{patientId}
    [HttpGet("patient/{patientId}")]
    public async Task<ActionResult<IEnumerable<InvestigationDto>>> GetPatientInvestigations(int patientId)
    {
        try
        {
            // Check if patient exists
            if (!await _context.Patients.AnyAsync(p => p.Id == patientId))
            {
                return NotFound($"Patient with ID {patientId} not found");
            }

            var investigations = await _context.Investigations
                .Include(i => i.Patient)
                .Include(i => i.OrderedByUser)
                .Where(i => i.PatientId == patientId)
                .OrderByDescending(i => i.OrderedDate)
                .Select(i => new InvestigationDto
                {
                    Id = i.Id,
                    PatientId = i.PatientId,
                    PatientName = $"{i.Patient.FirstName} {i.Patient.LastName}",
                    PatientCode = i.Patient.PatientId,
                    InvestigationType = i.InvestigationType,
                    InvestigationName = i.InvestigationName,
                    OrderedDate = i.OrderedDate,
                    ResultDate = i.ResultDate,
                    ResultValue = i.ResultValue,
                    NormalRange = i.NormalRange,
                    Status = i.Status,
                    Priority = i.Priority,
                    OrderedBy = i.OrderedBy,
                    OrderedByName = i.OrderedByUser != null ? $"{i.OrderedByUser.FirstName} {i.OrderedByUser.LastName}" : null,
                    CreatedAt = i.CreatedAt,
                    UpdatedAt = i.UpdatedAt
                })
                .ToListAsync();

            return Ok(investigations);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving investigations for patient {PatientId}", patientId);
            return StatusCode(500, "An error occurred while retrieving patient investigations");
        }
    }

    // POST: api/investigations
    [HttpPost]
    [Authorize(Roles = "Doctor,Staff,Admin")] // Only Doctors, Staff and Admin can create investigations
    public async Task<ActionResult<InvestigationDto>> CreateInvestigation(CreateInvestigationDto createInvestigationDto)
    {
        try
        {
            var currentUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            // Check if patient exists
            var patient = await _context.Patients.FindAsync(createInvestigationDto.PatientId);
            if (patient == null)
            {
                return BadRequest($"Patient with ID {createInvestigationDto.PatientId} not found");
            }

            var investigation = new Investigation
            {
                PatientId = createInvestigationDto.PatientId,
                InvestigationType = createInvestigationDto.InvestigationType,
                InvestigationName = createInvestigationDto.InvestigationName,
                OrderedDate = DateTime.SpecifyKind(createInvestigationDto.OrderedDate, DateTimeKind.Utc),
                ResultDate = createInvestigationDto.ResultDate.HasValue ? DateTime.SpecifyKind(createInvestigationDto.ResultDate.Value, DateTimeKind.Utc) : null,
                ResultValue = createInvestigationDto.ResultValue,
                NormalRange = createInvestigationDto.NormalRange,
                Status = createInvestigationDto.Status,
                Priority = createInvestigationDto.Priority,
                OrderedBy = currentUserId,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Investigations.Add(investigation);
            await _context.SaveChangesAsync();

            // Reload with navigation properties
            await _context.Entry(investigation)
                .Reference(i => i.Patient)
                .LoadAsync();
            await _context.Entry(investigation)
                .Reference(i => i.OrderedByUser)
                .LoadAsync();

            var investigationDto = new InvestigationDto
            {
                Id = investigation.Id,
                PatientId = investigation.PatientId,
                PatientName = $"{investigation.Patient.FirstName} {investigation.Patient.LastName}",
                PatientCode = investigation.Patient.PatientId,
                InvestigationType = investigation.InvestigationType,
                InvestigationName = investigation.InvestigationName,
                OrderedDate = investigation.OrderedDate,
                ResultDate = investigation.ResultDate,
                ResultValue = investigation.ResultValue,
                NormalRange = investigation.NormalRange,
                Status = investigation.Status,
                Priority = investigation.Priority,
                OrderedBy = investigation.OrderedBy,
                OrderedByName = investigation.OrderedByUser != null ? $"{investigation.OrderedByUser.FirstName} {investigation.OrderedByUser.LastName}" : null,
                CreatedAt = investigation.CreatedAt,
                UpdatedAt = investigation.UpdatedAt
            };

            return CreatedAtAction(nameof(GetInvestigation), new { id = investigation.Id }, investigationDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating investigation");
            return StatusCode(500, "An error occurred while creating the investigation");
        }
    }

    // PUT: api/investigations/{id}
    [HttpPut("{id}")]
    [Authorize(Roles = "Doctor,Staff,Admin")] // Only Doctors, Staff and Admin can update investigations
    public async Task<IActionResult> UpdateInvestigation(int id, UpdateInvestigationDto updateInvestigationDto)
    {
        try
        {
            var investigation = await _context.Investigations.FindAsync(id);
            if (investigation == null)
            {
                return NotFound($"Investigation with ID {id} not found");
            }

            // Check if patient exists
            if (updateInvestigationDto.PatientId != investigation.PatientId)
            {
                var patient = await _context.Patients.FindAsync(updateInvestigationDto.PatientId);
                if (patient == null)
                {
                    return BadRequest($"Patient with ID {updateInvestigationDto.PatientId} not found");
                }
            }

            // Update properties
            investigation.PatientId = updateInvestigationDto.PatientId;
            investigation.InvestigationType = updateInvestigationDto.InvestigationType;
            investigation.InvestigationName = updateInvestigationDto.InvestigationName;
            investigation.OrderedDate = DateTime.SpecifyKind(updateInvestigationDto.OrderedDate, DateTimeKind.Utc);
            investigation.ResultDate = updateInvestigationDto.ResultDate.HasValue ? DateTime.SpecifyKind(updateInvestigationDto.ResultDate.Value, DateTimeKind.Utc) : null;
            investigation.ResultValue = updateInvestigationDto.ResultValue;
            investigation.NormalRange = updateInvestigationDto.NormalRange;
            investigation.Status = updateInvestigationDto.Status;
            investigation.Priority = updateInvestigationDto.Priority;
            investigation.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating investigation {InvestigationId}", id);
            return StatusCode(500, "An error occurred while updating the investigation");
        }
    }

    // DELETE: api/investigations/{id}
    [HttpDelete("{id}")]
    [Authorize(Roles = "Doctor,Admin")] // Only Doctors and Admin can delete investigations
    public async Task<IActionResult> DeleteInvestigation(int id)
    {
        try
        {
            var investigation = await _context.Investigations.FindAsync(id);
            if (investigation == null)
            {
                return NotFound($"Investigation with ID {id} not found");
            }

            _context.Investigations.Remove(investigation);
            await _context.SaveChangesAsync();

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting investigation {InvestigationId}", id);
            return StatusCode(500, "An error occurred while deleting the investigation");
        }
    }

    // GET: api/investigations/statistics
    [HttpGet("statistics")]
    public async Task<ActionResult<InvestigationStatisticsDto>> GetInvestigationStatistics()
    {
        try
        {
            var statistics = new InvestigationStatisticsDto
            {
                TotalInvestigations = await _context.Investigations.CountAsync(),
                PendingInvestigations = await _context.Investigations.CountAsync(i => i.Status == "pending"),
                CompletedInvestigations = await _context.Investigations.CountAsync(i => i.Status == "completed"),
                UrgentInvestigations = await _context.Investigations.CountAsync(i => i.Priority == "urgent" || i.Priority == "stat"),
                InvestigationsThisMonth = await _context.Investigations
                    .CountAsync(i => i.OrderedDate >= new DateTime(DateTime.Today.Year, DateTime.Today.Month, 1)),
                InvestigationsByType = await _context.Investigations
                    .GroupBy(i => i.InvestigationType)
                    .Select(g => new InvestigationTypeCountDto { InvestigationType = g.Key, Count = g.Count() })
                    .OrderByDescending(x => x.Count)
                    .ToListAsync(),
                InvestigationsByStatus = await _context.Investigations
                    .GroupBy(i => i.Status)
                    .Select(g => new InvestigationStatusCountDto { Status = g.Key, Count = g.Count() })
                    .ToListAsync(),
                InvestigationsByPriority = await _context.Investigations
                    .GroupBy(i => i.Priority)
                    .Select(g => new InvestigationPriorityCountDto { Priority = g.Key, Count = g.Count() })
                    .ToListAsync()
            };

            return Ok(statistics);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving investigation statistics");
            return StatusCode(500, "An error occurred while retrieving statistics");
        }
    }
}
