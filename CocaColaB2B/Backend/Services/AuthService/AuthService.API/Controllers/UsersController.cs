using AuthService.Application.Interfaces;
using AuthService.Domain.Entities;
using CocaColaB2B.Shared.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AuthService.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
public class UsersController : ControllerBase
{
    private readonly IUserRepository _repo;
    public UsersController(IUserRepository repo) => _repo = repo;

    [HttpGet]
    public async Task<ActionResult<List<UserDto>>> GetUsers()
    {
        var users = await _repo.GetAllAsync();
        return Ok(users.Select(u => new UserDto { Id = u.Id, FullName = u.FullName, Email = u.Email, Role = u.Role, ContactNumber = u.ContactNumber, Address = u.Address, CreatedAt = u.CreatedAt }));
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<UserDto>> GetUser(Guid id)
    {
        var u = await _repo.GetByIdAsync(id);
        if (u == null) return NotFound();
        return Ok(new UserDto { Id = u.Id, FullName = u.FullName, Email = u.Email, Role = u.Role, ContactNumber = u.ContactNumber, Address = u.Address, CreatedAt = u.CreatedAt });
    }

    [HttpPost]
    public async Task<ActionResult<UserDto>> CreateUser(CreateUserRequest request)
    {
        if (await _repo.GetByEmailAsync(request.Email) != null) return BadRequest("Email exists");
        var user = new UserEntity { FullName = request.FullName, Email = request.Email, PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password), Role = request.Role, ContactNumber = request.ContactNumber, Address = request.Address };
        await _repo.AddAsync(user);
        return Ok(new UserDto { Id = user.Id, FullName = user.FullName, Email = user.Email, Role = user.Role, ContactNumber = user.ContactNumber, Address = user.Address, CreatedAt = user.CreatedAt });
    }

    [HttpPut("{id}")]
    public async Task<ActionResult> UpdateUser(Guid id, UpdateUserRequest request)
    {
        var user = await _repo.GetByIdAsync(id);
        if (user == null) return NotFound();
        user.FullName = request.FullName; user.Email = request.Email; user.Role = request.Role; user.ContactNumber = request.ContactNumber; user.Address = request.Address;
        await _repo.UpdateAsync(user);
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> DeleteUser(Guid id)
    {
        var user = await _repo.GetByIdAsync(id);
        if (user == null) return NotFound();
        await _repo.DeleteAsync(user);
        return NoContent();
    }
}
