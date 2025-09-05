using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PatientManagementApi.Data;
using PatientManagementApi.Models;
using System.Security.Claims;

namespace PatientManagementApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Doctor,Nurse,Staff,Admin")] // Doctors, Nurses, Staff, and Admin can manage treatments
public class TreatmentsController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<TreatmentsController> _logger;

    public TreatmentsController(ApplicationDbContext context, ILogger<TreatmentsController> logger)
    {
        _context = context;
        _logger = logger;
    }

    // GET: api/treatments
    [HttpGet]
    public async Task<ActionResult<IEnumerable<TreatmentDto>>> GetTreatments(
        [FromQuery] int? patientId = null,
        [FromQuery] string? treatmentType = null,
        [FromQuery] string? status = null,
        [FromQuery] string? search = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10)
    {
        try
        {
            var query = _context.Treatments
                .Include(t => t.Patient)
                .Include(t => t.Creator)
                .AsQueryable();

            // Apply filters
            if (patientId.HasValue)
            {
                query = query.Where(t => t.PatientId == patientId.Value);
            }

            if (!string.IsNullOrEmpty(treatmentType))
            {
                query = query.Where(t => t.TreatmentType.Contains(treatmentType));
            }

            if (!string.IsNullOrEmpty(status))
            {
                query = query.Where(t => t.Status == status);
            }

            if (!string.IsNullOrEmpty(search))
            {
                query = query.Where(t =>
                    t.TreatmentType.Contains(search) ||
                    (t.TreatmentName != null && t.TreatmentName.Contains(search)) ||
                    t.Patient.FirstName.Contains(search) ||
                    t.Patient.LastName.Contains(search) ||
                    t.Patient.PatientId.Contains(search));
            }

            // Get total count for pagination
            var totalCount = await query.CountAsync();

            // Apply pagination and select DTOs
            var treatments = await query
                .OrderByDescending(t => t.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(t => new TreatmentDto
                {
                    Id = t.Id,
                    PatientId = t.PatientId,
                    PatientName = $"{t.Patient.FirstName} {t.Patient.LastName}",
                    PatientCode = t.Patient.PatientId,
                    TreatmentType = t.TreatmentType,
                    TreatmentName = t.TreatmentName,
                    StartDate = t.StartDate,
                    EndDate = t.EndDate,
                    Dosage = t.Dosage,
                    Frequency = t.Frequency,
                    Status = t.Status,
                    SideEffects = t.SideEffects,
                    Response = t.Response,
                    CreatedBy = t.CreatedBy,
                    CreatedByName = t.Creator != null ? $"{t.Creator.FirstName} {t.Creator.LastName}" : null,
                    CreatedAt = t.CreatedAt,
                    UpdatedAt = t.UpdatedAt
                })
                .ToListAsync();

            var response = new
            {
                Data = treatments,
                TotalCount = totalCount,
                Page = page,
                PageSize = pageSize,
                TotalPages = (int)Math.Ceiling((double)totalCount / pageSize)
            };

            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving treatments");
            return StatusCode(500, "An error occurred while retrieving treatments");
        }
    }

    // GET: api/treatments/{id}
    [HttpGet("{id}")]
    public async Task<ActionResult<TreatmentDetailDto>> GetTreatment(int id)
    {
        try
        {
            var treatment = await _context.Treatments
                .Include(t => t.Patient)
                .Include(t => t.Creator)
                .FirstOrDefaultAsync(t => t.Id == id);

            if (treatment == null)
            {
                return NotFound($"Treatment with ID {id} not found");
            }

            var treatmentDetail = new TreatmentDetailDto
            {
                Id = treatment.Id,
                PatientId = treatment.PatientId,
                PatientName = $"{treatment.Patient.FirstName} {treatment.Patient.LastName}",
                PatientCode = treatment.Patient.PatientId,
                TreatmentType = treatment.TreatmentType,
                TreatmentName = treatment.TreatmentName,
                StartDate = treatment.StartDate,
                EndDate = treatment.EndDate,
                Dosage = treatment.Dosage,
                Frequency = treatment.Frequency,
                Status = treatment.Status,
                SideEffects = treatment.SideEffects,
                Response = treatment.Response,
                CreatedBy = treatment.CreatedBy,
                CreatedByName = treatment.Creator != null ? $"{treatment.Creator.FirstName} {treatment.Creator.LastName}" : null,
                CreatedAt = treatment.CreatedAt,
                UpdatedAt = treatment.UpdatedAt
            };

            return Ok(treatmentDetail);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving treatment {TreatmentId}", id);
            return StatusCode(500, "An error occurred while retrieving the treatment");
        }
    }

    // GET: api/treatments/patient/{patientId}
    [HttpGet("patient/{patientId}")]
    public async Task<ActionResult<IEnumerable<TreatmentDto>>> GetPatientTreatments(int patientId)
    {
        try
        {
            // Check if patient exists
            if (!await _context.Patients.AnyAsync(p => p.Id == patientId))
            {
                return NotFound($"Patient with ID {patientId} not found");
            }

            var treatments = await _context.Treatments
                .Include(t => t.Patient)
                .Include(t => t.Creator)
                .Where(t => t.PatientId == patientId)
                .OrderByDescending(t => t.StartDate ?? t.CreatedAt)
                .Select(t => new TreatmentDto
                {
                    Id = t.Id,
                    PatientId = t.PatientId,
                    PatientName = $"{t.Patient.FirstName} {t.Patient.LastName}",
                    PatientCode = t.Patient.PatientId,
                    TreatmentType = t.TreatmentType,
                    TreatmentName = t.TreatmentName,
                    StartDate = t.StartDate,
                    EndDate = t.EndDate,
                    Dosage = t.Dosage,
                    Frequency = t.Frequency,
                    Status = t.Status,
                    SideEffects = t.SideEffects,
                    Response = t.Response,
                    CreatedBy = t.CreatedBy,
                    CreatedByName = t.Creator != null ? $"{t.Creator.FirstName} {t.Creator.LastName}" : null,
                    CreatedAt = t.CreatedAt,
                    UpdatedAt = t.UpdatedAt
                })
                .ToListAsync();

            return Ok(treatments);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving treatments for patient {PatientId}", patientId);
            return StatusCode(500, "An error occurred while retrieving patient treatments");
        }
    }

    // POST: api/treatments
    [HttpPost]
    [Authorize(Roles = "Doctor,Staff,Admin")] // Only Doctors, Staff and Admin can create treatments
    public async Task<ActionResult<TreatmentDto>> CreateTreatment(CreateTreatmentDto createTreatmentDto)
    {
        try
        {
            var currentUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            // Check if patient exists
            var patient = await _context.Patients.FindAsync(createTreatmentDto.PatientId);
            if (patient == null)
            {
                return BadRequest($"Patient with ID {createTreatmentDto.PatientId} not found");
            }

            var treatment = new Treatment
            {
                PatientId = createTreatmentDto.PatientId,
                TreatmentType = createTreatmentDto.TreatmentType,
                TreatmentName = createTreatmentDto.TreatmentName,
                StartDate = createTreatmentDto.StartDate.HasValue ? DateTime.SpecifyKind(createTreatmentDto.StartDate.Value, DateTimeKind.Utc) : null,
                EndDate = createTreatmentDto.EndDate.HasValue ? DateTime.SpecifyKind(createTreatmentDto.EndDate.Value, DateTimeKind.Utc) : null,
                Dosage = createTreatmentDto.Dosage,
                Frequency = createTreatmentDto.Frequency,
                Status = createTreatmentDto.Status,
                SideEffects = createTreatmentDto.SideEffects,
                Response = createTreatmentDto.Response,
                CreatedBy = currentUserId,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Treatments.Add(treatment);
            await _context.SaveChangesAsync();

            // Reload with navigation properties
            await _context.Entry(treatment)
                .Reference(t => t.Patient)
                .LoadAsync();
            await _context.Entry(treatment)
                .Reference(t => t.Creator)
                .LoadAsync();

            var treatmentDto = new TreatmentDto
            {
                Id = treatment.Id,
                PatientId = treatment.PatientId,
                PatientName = $"{treatment.Patient.FirstName} {treatment.Patient.LastName}",
                PatientCode = treatment.Patient.PatientId,
                TreatmentType = treatment.TreatmentType,
                TreatmentName = treatment.TreatmentName,
                StartDate = treatment.StartDate,
                EndDate = treatment.EndDate,
                Dosage = treatment.Dosage,
                Frequency = treatment.Frequency,
                Status = treatment.Status,
                SideEffects = treatment.SideEffects,
                Response = treatment.Response,
                CreatedBy = treatment.CreatedBy,
                CreatedByName = treatment.Creator != null ? $"{treatment.Creator.FirstName} {treatment.Creator.LastName}" : null,
                CreatedAt = treatment.CreatedAt,
                UpdatedAt = treatment.UpdatedAt
            };

            return CreatedAtAction(nameof(GetTreatment), new { id = treatment.Id }, treatmentDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating treatment");
            return StatusCode(500, "An error occurred while creating the treatment");
        }
    }

    // PUT: api/treatments/{id}
    [HttpPut("{id}")]
    [Authorize(Roles = "Doctor,Staff,Admin")] // Only Doctors, Staff and Admin can update treatments
    public async Task<IActionResult> UpdateTreatment(int id, UpdateTreatmentDto updateTreatmentDto)
    {
        try
        {
            var treatment = await _context.Treatments.FindAsync(id);
            if (treatment == null)
            {
                return NotFound($"Treatment with ID {id} not found");
            }

            // Check if patient exists
            if (updateTreatmentDto.PatientId != treatment.PatientId)
            {
                var patient = await _context.Patients.FindAsync(updateTreatmentDto.PatientId);
                if (patient == null)
                {
                    return BadRequest($"Patient with ID {updateTreatmentDto.PatientId} not found");
                }
            }

            // Update properties
            treatment.PatientId = updateTreatmentDto.PatientId;
            treatment.TreatmentType = updateTreatmentDto.TreatmentType;
            treatment.TreatmentName = updateTreatmentDto.TreatmentName;
            treatment.StartDate = updateTreatmentDto.StartDate.HasValue ? DateTime.SpecifyKind(updateTreatmentDto.StartDate.Value, DateTimeKind.Utc) : null;
            treatment.EndDate = updateTreatmentDto.EndDate.HasValue ? DateTime.SpecifyKind(updateTreatmentDto.EndDate.Value, DateTimeKind.Utc) : null;
            treatment.Dosage = updateTreatmentDto.Dosage;
            treatment.Frequency = updateTreatmentDto.Frequency;
            treatment.Status = updateTreatmentDto.Status;
            treatment.SideEffects = updateTreatmentDto.SideEffects;
            treatment.Response = updateTreatmentDto.Response;
            treatment.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating treatment {TreatmentId}", id);
            return StatusCode(500, "An error occurred while updating the treatment");
        }
    }

    // DELETE: api/treatments/{id}
    [HttpDelete("{id}")]
    [Authorize(Roles = "Doctor,Admin")] // Only Doctors and Admin can delete treatments
    public async Task<IActionResult> DeleteTreatment(int id)
    {
        try
        {
            var treatment = await _context.Treatments.FindAsync(id);
            if (treatment == null)
            {
                return NotFound($"Treatment with ID {id} not found");
            }

            _context.Treatments.Remove(treatment);
            await _context.SaveChangesAsync();

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting treatment {TreatmentId}", id);
            return StatusCode(500, "An error occurred while deleting the treatment");
        }
    }

    // GET: api/treatments/statistics
    [HttpGet("statistics")]
    public async Task<ActionResult<TreatmentStatisticsDto>> GetTreatmentStatistics()
    {
        try
        {
            var statistics = new TreatmentStatisticsDto
            {
                TotalTreatments = await _context.Treatments.CountAsync(),
                ActiveTreatments = await _context.Treatments.CountAsync(t => t.Status == "active"),
                CompletedTreatments = await _context.Treatments.CountAsync(t => t.Status == "completed"),
                TreatmentsThisMonth = await _context.Treatments
                    .CountAsync(t => t.CreatedAt >= new DateTime(DateTime.Today.Year, DateTime.Today.Month, 1)),
                TreatmentsByType = await _context.Treatments
                    .GroupBy(t => t.TreatmentType)
                    .Select(g => new TreatmentTypeCountDto { TreatmentType = g.Key, Count = g.Count() })
                    .OrderByDescending(x => x.Count)
                    .ToListAsync(),
                TreatmentsByStatus = await _context.Treatments
                    .GroupBy(t => t.Status)
                    .Select(g => new TreatmentStatusCountDto { Status = g.Key, Count = g.Count() })
                    .ToListAsync()
            };

            return Ok(statistics);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving treatment statistics");
            return StatusCode(500, "An error occurred while retrieving statistics");
        }
    }
}
