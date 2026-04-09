using CocaColaB2B.Shared.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NotificationService.Infrastructure.Data;
using System.Security.Claims;

namespace NotificationService.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class NotificationsController : ControllerBase
{
    private readonly NotificationDbContext _db;
    public NotificationsController(NotificationDbContext db) => _db = db;

    private Guid? TryGetUserId()
    {
        var value = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return Guid.TryParse(value, out var id) ? id : null;
    }

    private string UserRole => User.FindFirst(ClaimTypes.Role)?.Value ?? "";

    [HttpGet]
    public async Task<ActionResult<List<NotificationDto>>> Get()
    {
        var userId = TryGetUserId();
        if (userId is null) return Unauthorized();

        // Admins and WarehouseManagers also see system-wide notifications (UserId = Guid.Empty)
        IQueryable<NotificationService.Domain.Entities.NotificationEntity> query;
        if (UserRole is "Admin" or "WarehouseManager")
            query = _db.Notifications.Where(n => n.UserId == userId || n.UserId == Guid.Empty);
        else
            query = _db.Notifications.Where(n => n.UserId == userId);

        var notifs = await query.OrderByDescending(n => n.CreatedAt).Take(50).ToListAsync();
        return Ok(notifs.Select(n => new NotificationDto
        {
            Id = n.Id, Message = n.Message, Type = n.Type, IsRead = n.IsRead, CreatedAt = n.CreatedAt
        }));
    }

    [HttpPut("{id}/read")]
    public async Task<ActionResult> MarkRead(Guid id)
    {
        var n = await _db.Notifications.FindAsync(id);
        if (n == null) return NotFound();
        n.IsRead = true;
        await _db.SaveChangesAsync();
        return Ok();
    }

    [HttpPut("read-all")]
    public async Task<ActionResult> MarkAllRead()
    {
        var userId = TryGetUserId();
        if (userId is null) return Unauthorized();

        var isPrivileged = UserRole == "Admin" || UserRole == "WarehouseManager";
        await _db.Notifications
            .Where(n => (n.UserId == userId || (isPrivileged && n.UserId == Guid.Empty)) && !n.IsRead)
            .ExecuteUpdateAsync(s => s.SetProperty(n => n.IsRead, true));
        return Ok();
    }
}
