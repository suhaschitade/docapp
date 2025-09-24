using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using PatientManagementApi.Data;
using DataMigration.Services;
using DataMigration.Models;
using System.CommandLine;

namespace DataMigration;

class Program
{
    static async Task<int> Main(string[] args)
    {
        var filePathOption = new Option<string>(
            "--file", 
            "Path to the Excel file to import")
        { IsRequired = true };

        var validateOnlyOption = new Option<bool>(
            "--validate-only", 
            "Only validate the data without importing");

        var createdByOption = new Option<string>(
            "--created-by", 
            () => "DataMigrationTool",
            "Name of the user performing the import");

        var rootCommand = new RootCommand("Excel Patient Data Import Tool")
        {
            filePathOption,
            validateOnlyOption,
            createdByOption
        };

        rootCommand.SetHandler(async (filePath, validateOnly, createdBy) =>
        {
            try
            {
                var host = CreateHost();
                using var scope = host.Services.CreateScope();
                
                var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
                var importService = scope.ServiceProvider.GetRequiredService<ExcelImportService>();

                logger.LogInformation("Starting Excel import process...");
                logger.LogInformation("File: {FilePath}", filePath);
                logger.LogInformation("Validate Only: {ValidateOnly}", validateOnly);
                logger.LogInformation("Created By: {CreatedBy}", createdBy);

                if (validateOnly)
                {
                    logger.LogInformation("Running validation only...");
                    var validationResult = await importService.ValidateImportDataAsync(filePath);
                    DisplayResults(validationResult, logger, true);
                }
                else
                {
                    logger.LogInformation("Starting data import...");
                    var importResult = await importService.ImportFromExcelAsync(filePath, createdBy);
                    DisplayResults(importResult, logger, false);
                }

                logger.LogInformation("Process completed.");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error: {ex.Message}");
                Console.WriteLine($"Stack Trace: {ex.StackTrace}");
                Environment.ExitCode = 1;
            }
        }, filePathOption, validateOnlyOption, createdByOption);

        return await rootCommand.InvokeAsync(args);
    }

    static IHost CreateHost()
    {
        var configuration = new ConfigurationBuilder()
            .SetBasePath(Directory.GetCurrentDirectory())
            .AddJsonFile("appsettings.json", optional: false)
            .AddJsonFile("appsettings.Development.json", optional: true)
            .AddEnvironmentVariables()
            .Build();

        return Host.CreateDefaultBuilder()
            .ConfigureServices((context, services) =>
            {
                // Add Entity Framework
                services.AddDbContext<ApplicationDbContext>(options =>
                    options.UseNpgsql(configuration.GetConnectionString("DefaultConnection")));

                // Add services
                services.AddScoped<ExcelImportService>();
                
                // Add logging
                services.AddLogging(builder =>
                {
                    builder.AddConsole();
                    builder.SetMinimumLevel(LogLevel.Information);
                });
            })
            .Build();
    }

    static void DisplayResults(ImportResult result, ILogger logger, bool validationOnly)
    {
        var operation = validationOnly ? "Validation" : "Import";
        
        Console.WriteLine();
        Console.WriteLine($"=== {operation} Results ===");
        Console.WriteLine($"Total Records: {result.TotalRecords}");
        Console.WriteLine($"Successful: {result.SuccessfulImports}");
        Console.WriteLine($"Skipped: {result.SkippedRecords}");
        Console.WriteLine($"Errors: {result.Errors}");
        Console.WriteLine($"Duration: {result.Duration.TotalSeconds:F2} seconds");
        Console.WriteLine();

        if (result.ErrorMessages.Any())
        {
            Console.WriteLine("=== Errors ===");
            foreach (var error in result.ErrorMessages.Take(20)) // Show first 20 errors
            {
                Console.WriteLine($"  {error}");
            }
            
            if (result.ErrorMessages.Count > 20)
            {
                Console.WriteLine($"  ... and {result.ErrorMessages.Count - 20} more errors");
            }
            Console.WriteLine();
        }

        if (result.WarningMessages.Any())
        {
            Console.WriteLine("=== Warnings ===");
            foreach (var warning in result.WarningMessages.Take(10))
            {
                Console.WriteLine($"  {warning}");
            }
            Console.WriteLine();
        }

        // Log summary
        logger.LogInformation("{Operation} completed: {Success}/{Total} records processed successfully in {Duration}s",
            operation, result.SuccessfulImports, result.TotalRecords, result.Duration.TotalSeconds);

        if (result.Errors > 0)
        {
            logger.LogWarning("{ErrorCount} errors encountered during {Operation}", result.Errors, operation.ToLowerInvariant());
        }
    }
}

// Extension class for string operations
public static class StringExtensions
{
    public static string ToTitleCase(this string input)
    {
        if (string.IsNullOrWhiteSpace(input))
            return input;
        
        return System.Globalization.CultureInfo.CurrentCulture.TextInfo.ToTitleCase(input.ToLowerInvariant());
    }
}