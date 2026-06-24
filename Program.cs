using System.ComponentModel.DataAnnotations;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Liveness/readiness probe — used by Kubernetes and the DAST stage
app.MapGet("/health", () =>
    Results.Ok(new { status = "healthy", service = "loan-fulfillment-api" }))
   .WithName("HealthCheck");

// Retrieve a loan application by id
app.MapGet("/api/loans/{id}", (string id) =>
    Results.Ok(new LoanApplication(id, "Aarav Sharma", 2_500_000m, "UNDER_REVIEW")))
   .WithName("GetLoan");

// Submit a new loan application (with input validation)
app.MapPost("/api/loans", (LoanRequest req) =>
{
    var ctx = new ValidationContext(req);
    var errors = new List<ValidationResult>();
    if (!Validator.TryValidateObject(req, ctx, errors, validateAllProperties: true))
        return Results.ValidationProblem(
            errors.ToDictionary(e => e.MemberNames.FirstOrDefault() ?? "field",
                                e => new[] { e.ErrorMessage ?? "invalid" }));

    var id = Guid.NewGuid().ToString("N")[..8];
    return Results.Created($"/api/loans/{id}",
        new LoanApplication(id, req.Applicant, req.Amount, "SUBMITTED"));
})
.WithName("CreateLoan");

app.Run();

public record LoanApplication(string Id, string Applicant, decimal Amount, string Status);

public record LoanRequest(
    [property: Required] string Applicant,
    [property: Range(10_000, 50_000_000)] decimal Amount);
