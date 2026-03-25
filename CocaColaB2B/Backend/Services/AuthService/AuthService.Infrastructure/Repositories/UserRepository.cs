using Microsoft.EntityFrameworkCore;
using AuthService.Application.Interfaces;
using AuthService.Domain.Entities;
using AuthService.Infrastructure.Data;

namespace AuthService.Infrastructure.Repositories;

public class UserRepository : IUserRepository
{
    private readonly AuthDbContext _context;
    public UserRepository(AuthDbContext context) => _context = context;

    public async Task<UserEntity?> GetByEmailAsync(string email) => await _context.Users.FirstOrDefaultAsync(u => u.Email == email);
    public async Task<UserEntity?> GetByIdAsync(Guid id) => await _context.Users.FindAsync(id);
    public async Task<List<UserEntity>> GetAllAsync() => await _context.Users.OrderByDescending(u => u.CreatedAt).ToListAsync();
    public async Task<bool> AnyAsync() => await _context.Users.AnyAsync();
    public async Task AddAsync(UserEntity user) { await _context.Users.AddAsync(user); await _context.SaveChangesAsync(); }
    public async Task UpdateAsync(UserEntity user) { _context.Users.Update(user); await _context.SaveChangesAsync(); }
    public async Task DeleteAsync(UserEntity user) { _context.Users.Remove(user); await _context.SaveChangesAsync(); }
}
