using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PatientManagementApi.Data;
using PatientManagementApi.Models;

namespace PatientManagementApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class DoctorsController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<DoctorsController> _logger;

    public DoctorsController(ApplicationDbContext context, ILogger<DoctorsController> logger)
    {
        _context = context;
        _logger = logger;
    }

    // GET: api/doctors
    [HttpGet]
    public async Task<ActionResult<IEnumerable<DoctorDto>>> GetDoctors()
    {
        _logger.LogInformation("Retrieving all doctors");
        try
        {
            // First, get the Doctor role ID
            var doctorRole = await _context.Roles
                .FirstOrDefaultAsync(r => r.Name == "Doctor");

            if (doctorRole == null)
            {
                _logger.LogWarning("Doctor role not found");
                return Ok(new List<DoctorDto>());
            }

            // Get user IDs who have the Doctor role
            var doctorUserIds = await _context.UserRoles
                .Where(ur => ur.RoleId == doctorRole.Id)
                .Select(ur => ur.UserId)
                .ToListAsync();

            // Get users with these IDs
            var doctorUsers = await _context.Users
                .Where(u => doctorUserIds.Contains(u.Id))
                .ToListAsync();

            var doctors = doctorUsers.Select(user => new DoctorDto
            {
                Id = user.Id,
                FirstName = user.FirstName,
                LastName = user.LastName,
                Email = user.Email,
                Department = user.Department,
                Specialization = user.Specialization,
                FullName = $"{user.FirstName} {user.LastName}",
                DisplayName = !string.IsNullOrEmpty(user.Specialization) 
                    ? $"{user.FirstName} {user.LastName} - {user.Specialization}"
                    : $"{user.FirstName} {user.LastName}"
            }).OrderBy(d => d.FirstName).ToList();

            return Ok(doctors);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving doctors");
            return StatusCode(500, "An error occurred while retrieving doctors");
        }
    }

    // GET: api/doctors/{id}
    [HttpGet("{id}")]
    public async Task<ActionResult<DoctorDto>> GetDoctor(string id)
    {
        _logger.LogInformation("Retrieving doctor {DoctorId}", id);
        try
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null)
            {
                return NotFound($"Doctor with ID {id} not found");
            }

            // Check if user has Doctor role
            var doctorRole = await _context.Roles
                .FirstOrDefaultAsync(r => r.Name == "Doctor");

            if (doctorRole == null)
            {
                return NotFound("Doctor role not found in system");
            }

            var hasRole = await _context.UserRoles
                .AnyAsync(ur => ur.UserId == id && ur.RoleId == doctorRole.Id);

            if (!hasRole)
            {
                return NotFound($"User with ID {id} is not a doctor");
            }

            var doctor = new DoctorDto
            {
                Id = user.Id,
                FirstName = user.FirstName,
                LastName = user.LastName,
                Email = user.Email,
                Department = user.Department,
                Specialization = user.Specialization,
                FullName = $"{user.FirstName} {user.LastName}",
                DisplayName = !string.IsNullOrEmpty(user.Specialization) 
                    ? $"{user.FirstName} {user.LastName} - {user.Specialization}"
                    : $"{user.FirstName} {user.LastName}"
            };

            return Ok(doctor);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving doctor {DoctorId}", id);
            return StatusCode(500, "An error occurred while retrieving the doctor");
        }
    }
}

public class DoctorDto
{
    public string Id { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? Department { get; set; }
    public string? Specialization { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
}
