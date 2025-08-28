using FinTrack.API.Data;
using FinTrack.API.Mappings;
using FinTrack.API.Services;
using Microsoft.EntityFrameworkCore;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Logging;
using Microsoft.AspNetCore.Authentication.JwtBearer;    // JWT bazlı authentication kullanımına geçildi
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.Authentication.Cookies; // Eskiden Cookie bazlı authentication sırasında kullanılıyordu
using Microsoft.IdentityModel.Tokens; 
using System.Text;

var builder = WebApplication.CreateBuilder(args);


// builder.Services.AddControllers();
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
        options.JsonSerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
    });

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Veritabanı yapılandırma - PostgreSQL veya MySQL
if (builder.Configuration.GetValue<string>("Database:Provider") == "PostgreSQL")
{
    builder.Services.AddDbContext<AppDbContext>(options =>
        options.UseNpgsql(builder.Configuration.GetConnectionString("PostgreSQLConnection")));
}
else
{
    builder.Services.AddDbContext<AppDbContext>(options =>
        options.UseMySql(
            builder.Configuration.GetConnectionString("MySQLConnection"),
            new MySqlServerVersion(new Version(8, 0, 21))));
}


//  JWT Authentication mekanizması 
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = builder.Configuration["Jwt:Issuer"],
        ValidAudience = builder.Configuration["Jwt:Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]))
    };
});


builder.Services.AddAutoMapper(typeof(MappingProfile)); 
// HttpClient'ları ayrı ayrı kaydedip sonra ana servise enjekte edilmekte
builder.Services.AddHttpClient<FinnhubMarketDataService>();
builder.Services.AddHttpClient<TwelveDataMarketDataService>();
// TransferService'de kullanılıyor
builder.Services.AddHttpContextAccessor();

// Servis kayıtları
builder.Services.AddScoped<IUserService, UserService>();  
builder.Services.AddScoped<IAccountService, AccountService>();
builder.Services.AddScoped<ITransactionService, TransactionService>();
builder.Services.AddScoped<ICategoryService, CategoryService>();
builder.Services.AddScoped<ITransferService, TransferService>();
builder.Services.AddScoped<IIbanService, IbanService>();
builder.Services.AddScoped<IUserAssetService, UserAssetService>();

builder.Services.AddScoped<IMarketDataService, MarketDataService>();
builder.Services.AddScoped<ITimeDepositService, TimeDepositService>();
builder.Services.AddScoped<ILoanService, LoanService>();
builder.Services.AddScoped<IPortfolioService, PortfolioService>();

// CORS politikası
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp", policyBuilder =>
    {
        policyBuilder.WithOrigins("http://localhost:3000")
            .AllowAnyMethod()
            .AllowAnyHeader()
            .AllowCredentials();
    });
});

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
    app.UseDeveloperExceptionPage(); // Geliştirme ortamında detaylı hata gösterimi
}

app.UseHttpsRedirection();
app.UseRouting();
app.UseCors("AllowReactApp");

// app.UseSession();    // Session artık kullanılmıyor

// Authentication ve Authorization middleware'leri
app.UseAuthentication();
// Session tabanlı kimlik doğrulamada bu genellikle gerekmeyebilir, fakat farklı bir cookie tabanlı kimlik doğrulama (örn: Identity) eklenirse lazım olur
app.UseAuthorization(); // Yetkilendirme middleware'i

app.MapControllers();

// Veritabanını oluşturup, seed data eklenmesi
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        var context = services.GetRequiredService<AppDbContext>();
        context.Database.Migrate();
        // Bu satır, bekleyen tüm migration'ları uygular.
                                    // EnsureCreated() yerine bunu kullanmak daha iyi bir pratiktir.
                                    // Seed data (eğer migration içinde değilse) burada çağrılabilir.
                                    // Örnek: DbInitializer.Initialize(context);
    }
    catch (Exception ex)
    {
        var logger = services.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "Veritabanı oluşturulurken veya migration uygulanırken bir hata oluştu.");
    }
}

app.Run();


