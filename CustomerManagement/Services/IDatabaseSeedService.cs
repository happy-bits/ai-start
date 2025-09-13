namespace CustomerManagement.Services
{
    public interface IDatabaseSeedService
    {
        Task<bool> RecreateDatabaseAsync();
        Task<bool> SeedTestDataAsync();
    }
}
