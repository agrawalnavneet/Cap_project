using AuthService.Domain.Entities;

namespace AuthService.Application.Interfaces;

public interface IUserRepository
{
    Task<UserEntity?> GetByEmailAsync(string email);
    Task<UserEntity?> GetByIdAsync(Guid id);
    Task<List<UserEntity>> GetAllAsync();
    Task<bool> AnyAsync();
    Task AddAsync(UserEntity user);
    Task UpdateAsync(UserEntity user);
    Task DeleteAsync(UserEntity user);
}
