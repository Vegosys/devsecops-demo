var builder = WebApplication.CreateBuilder(args);
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Says hello with the current date & time
app.MapGet("/hello", () =>
    Results.Ok(new { message = "hello", timestamp = DateTimeOffset.UtcNow }))
   .WithName("Hello");

// Liveness/readiness probe
app.MapGet("/healthz", () =>
    Results.Ok(new { status = "healthy" }))
   .WithName("HealthCheck");

// Simple ping/pong
app.MapGet("/ping", () => Results.Ok("pong"))
   .WithName("Ping");

app.Run();
