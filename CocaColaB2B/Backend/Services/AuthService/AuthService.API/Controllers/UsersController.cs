using AuthService.Application.Interfaces;
using AuthService.Domain.Entities;
using CocaColaB2B.Shared.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace AuthService.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin,WarehouseManager")]
public class UsersController : ControllerBase
{
    private readonly IUserRepository _repo;
    private readonly ILogger<UsersController> _logger;

    public UsersController(IUserRepository repo, ILogger<UsersController> logger)
    {
        _repo = repo;
        _logger = logger;
    }

    private static UserDto ToDto(UserEntity u) => new()
    {
        Id = u.Id, FullName = u.FullName, Email = u.Email, Role = u.Role,
        ContactNumber = u.ContactNumber, Address = u.Address, CreatedAt = u.CreatedAt,
        EnterpriseName = u.EnterpriseName, GstinNumber = u.GstinNumber,
        CreditPoints = u.CreditPoints, WeeklyUnitsPurchased = u.WeeklyUnitsPurchased,
        VehicleType = u.VehicleType
    };

    [HttpGet]
    public async Task<ActionResult<List<UserDto>>> GetUsers()
    {
        var currentRole = User.FindFirst(ClaimTypes.Role)?.Value;
        var users = await _repo.GetAllAsync();
        if (currentRole == "WarehouseManager")
            users = users.Where(u => u.Role == "Driver").ToList();
        return Ok(users.Select(ToDto));
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<UserDto>> GetUser(Guid id)
    {
        var u = await _repo.GetByIdAsync(id);
        if (u == null) return NotFound();
        return Ok(ToDto(u));
    }

    [HttpPost]
    public async Task<ActionResult<UserDto>> CreateUser(CreateUserRequest request)
    {
        var currentRole = User.FindFirst(ClaimTypes.Role)?.Value;

        if (currentRole == "Admin")
        {
            var allowedRoles = new[] { "WarehouseManager", "Driver" };
            if (!allowedRoles.Contains(request.Role))
                return BadRequest(new { message = "Admin can only create Warehouse Managers and Drivers." });
        }
        else if (currentRole == "WarehouseManager")
        {
            if (request.Role != "Driver")
                return BadRequest(new { message = "Warehouse Manager can only create Drivers." });
        }
        else return Forbid();

        // Driver must provide vehicle type
        if (request.Role == "Driver" && string.IsNullOrWhiteSpace(request.VehicleType))
            return BadRequest(new { message = "Vehicle type is required for Driver accounts." });

        if (await _repo.GetByEmailAsync(request.Email) != null)
            return BadRequest(new { message = "Email already exists." });

        var user = new UserEntity
        {
            FullName = request.FullName,
            Email = request.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            Role = request.Role,
            ContactNumber = request.ContactNumber,
            Address = request.Address,
            EnterpriseName = request.EnterpriseName?.Trim(),
            GstinNumber = request.GstinNumber?.ToUpper().Trim(),
            VehicleType = request.VehicleType?.Trim(),
            IsVerified = true
        };
        await _repo.AddAsync(user);
        _logger.LogInformation("User created: {Email} | Role: {Role}", user.Email, user.Role);
        return Ok(ToDto(user));
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult> UpdateUser(Guid id, UpdateUserRequest request)
    {
        var user = await _repo.GetByIdAsync(id);
        if (user == null) return NotFound();

        // Driver must have vehicle type
        if (request.Role == "Driver" && string.IsNullOrWhiteSpace(request.VehicleType))
            return BadRequest(new { message = "Vehicle type is required for Driver accounts." });

        user.FullName = request.FullName;
        user.Email = request.Email;
        user.Role = request.Role;
        user.ContactNumber = request.ContactNumber;
        user.Address = request.Address;
        user.EnterpriseName = request.EnterpriseName?.Trim();
        user.GstinNumber = request.GstinNumber?.ToUpper().Trim();
        user.VehicleType = request.VehicleType?.Trim();
        await _repo.UpdateAsync(user);
        return NoContent();
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult> DeleteUser(Guid id)
    {
        var user = await _repo.GetByIdAsync(id);
        if (user == null) return NotFound();
        await _repo.DeleteAsync(user);
        return NoContent();
    }

    // ── Credit Points ─────────────────────────────────────────────────────────

    /// <summary>Admin grants credit points to a wholesaler.</summary>
    [HttpPost("{id}/credit-points")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult> GrantCreditPoints(Guid id, GrantCreditPointsRequest request)
    {
        if (request.Points <= 0)
            return BadRequest(new { message = "Points must be greater than zero." });

        var user = await _repo.GetByIdAsync(id);
        if (user == null) return NotFound();
        if (user.Role != "Wholesaler")
            return BadRequest(new { message = "Credit points can only be granted to Wholesalers." });

        user.CreditPoints += request.Points;
        await _repo.UpdateAsync(user);

        _logger.LogInformation("Admin granted {Points} credit points to wholesaler {Email}. New total: {Total}",
            request.Points, user.Email, user.CreditPoints);

        return Ok(new { message = $"Granted {request.Points} points. New balance: {user.CreditPoints}", creditPoints = user.CreditPoints });
    }

    /// <summary>Get credit points and weekly stats for a wholesaler.</summary>
    [HttpGet("{id}/credit-points")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult> GetCreditPoints(Guid id)
    {
        var user = await _repo.GetByIdAsync(id);
        if (user == null) return NotFound();
        return Ok(new
        {
            userId = user.Id,
            fullName = user.FullName,
            creditPoints = user.CreditPoints,
            weeklyUnitsPurchased = user.WeeklyUnitsPurchased,
            weeklyResetDate = user.WeeklyResetDate
        });
    }
}
