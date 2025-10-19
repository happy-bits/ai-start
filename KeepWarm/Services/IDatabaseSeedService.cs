namespace KeepWarm.Services
{
    public interface IDatabaseSeedService
    {
        Task<bool> RecreateDatabaseAsync();
        Task<bool> SeedTestDataAsync();
    }
}
