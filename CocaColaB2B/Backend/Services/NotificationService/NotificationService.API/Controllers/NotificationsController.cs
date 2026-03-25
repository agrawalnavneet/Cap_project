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

    private Guid UserId => Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

    [HttpGet]
    public async Task<ActionResult<List<NotificationDto>>> Get()
    {
        var notifs = await _db.Notifications.Where(n => n.UserId == UserId).OrderByDescending(n => n.CreatedAt).Take(50).ToListAsync();
        return Ok(notifs.Select(n => new NotificationDto { Id = n.Id, Message = n.Message, Type = n.Type, IsRead = n.IsRead, CreatedAt = n.CreatedAt }));
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
        await _db.Notifications.Where(n => n.UserId == UserId && !n.IsRead).ExecuteUpdateAsync(s => s.SetProperty(n => n.IsRead, true));
        return Ok();
    }
}
