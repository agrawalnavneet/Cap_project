using AuthService.Data;
using CocaColaB2B.Shared.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AuthService.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
public class UsersController : ControllerBase
{
    private readonly AuthDbContext _db;

    public UsersController(AuthDbContext db) => _db = db;

    [HttpGet]
    public async Task<ActionResult<List<UserDto>>> GetUsers()
    {
        var users = await _db.Users.OrderByDescending(u => u.CreatedAt).ToListAsync();
        return Ok(users.Select(u => new UserDto { Id = u.Id, FullName = u.FullName, Email = u.Email, Role = u.Role, ContactNumber = u.ContactNumber, Address = u.Address, CreatedAt = u.CreatedAt }));
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<UserDto>> GetUser(Guid id)
    {
        var u = await _db.Users.FindAsync(id);
        if (u == null) return NotFound();
        return Ok(new UserDto { Id = u.Id, FullName = u.FullName, Email = u.Email, Role = u.Role, ContactNumber = u.ContactNumber, Address = u.Address, CreatedAt = u.CreatedAt });
    }

    [HttpPost]
    public async Task<ActionResult<UserDto>> CreateUser(CreateUserRequest request)
    {
        if (await _db.Users.AnyAsync(u => u.Email == request.Email)) return BadRequest("Email exists");
        var user = new UserEntity { FullName = request.FullName, Email = request.Email, PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password), Role = request.Role, ContactNumber = request.ContactNumber, Address = request.Address };
        _db.Users.Add(user);
        await _db.SaveChangesAsync();
        return Ok(new UserDto { Id = user.Id, FullName = user.FullName, Email = user.Email, Role = user.Role, ContactNumber = user.ContactNumber, Address = user.Address, CreatedAt = user.CreatedAt });
    }

    [HttpPut("{id}")]
    public async Task<ActionResult> UpdateUser(Guid id, UpdateUserRequest request)
    {
        var user = await _db.Users.FindAsync(id);
        if (user == null) return NotFound();
        user.FullName = request.FullName; user.Email = request.Email; user.Role = request.Role; user.ContactNumber = request.ContactNumber; user.Address = request.Address;
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> DeleteUser(Guid id)
    {
        var user = await _db.Users.FindAsync(id);
        if (user == null) return NotFound();
        _db.Users.Remove(user);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}
