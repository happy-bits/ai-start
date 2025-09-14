using KeepWarm.Data;
using KeepWarm.Models;
using KeepWarm.Services;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllersWithViews();

// Konfigurera Entity Framework med SQLite
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection")));

// Konfigurera Identity
builder.Services.AddIdentity<ApplicationUser, IdentityRole>(options =>
{
    // Konfigurera lösenordskrav
    options.Password.RequireDigit = true;
    options.Password.RequireLowercase = true;
    options.Password.RequireNonAlphanumeric = false;
    options.Password.RequireUppercase = true;
    options.Password.RequiredLength = 6;
    options.Password.RequiredUniqueChars = 1;

    // Konfigurera användarnamn
    options.User.RequireUniqueEmail = true;
})
.AddEntityFrameworkStores<ApplicationDbContext>()
.AddDefaultTokenProviders();

// Registrera services
builder.Services.AddScoped<ICustomerService, CustomerService>();
builder.Services.AddScoped<IIdentityService, IdentityService>();
builder.Services.AddScoped<IDatabaseSeedService, DatabaseSeedService>();

var app = builder.Build();

// Initialisera roller vid applikationsstart
using (var scope = app.Services.CreateScope())
{
    var identityService = scope.ServiceProvider.GetRequiredService<IIdentityService>();
    await identityService.InitializeRolesAsync();
}

// Configure the HTTP request pipeline.
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Home/Error");
    // The default HSTS value is 30 days. You may want to change this for production scenarios, see https://aka.ms/aspnetcore-hsts.
    app.UseHsts();
}

app.UseHttpsRedirection();
app.UseRouting();

// Aktivera autentisering och auktorisering
app.UseAuthentication();
app.UseAuthorization();

app.MapStaticAssets();

app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Home}/{action=Index}/{id?}")
    .WithStaticAssets();


app.Run();

// Gör Program tillgänglig för integrationstester
public partial class Program { }
