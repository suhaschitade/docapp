using System.Globalization;
using System.Text.RegularExpressions;
using PatientManagementApi.Models;
using DataMigration.Models;

namespace DataMigration.Services;

public static class DataCleaningService
{
    private static readonly Regex AgeRegex = new(@"(\d+)\s*(?:yrs?|years?|Yrs?|Years?)?", RegexOptions.Compiled | RegexOptions.IgnoreCase);
    private static readonly Regex PhoneRegex = new(@"[^\d+]", RegexOptions.Compiled);
    private static readonly Regex YearRegex = new(@"(\d{4})", RegexOptions.Compiled);

    public static (string firstName, string lastName) SplitName(string fullName)
    {
        if (string.IsNullOrWhiteSpace(fullName))
            return ("Unknown", "Unknown");

        var nameParts = fullName.Trim().Split(' ', StringSplitOptions.RemoveEmptyEntries);
        
        if (nameParts.Length == 0)
            return ("Unknown", "Unknown");
        
        if (nameParts.Length == 1)
            return (nameParts[0], "");
        
        var firstName = nameParts[0];
        var lastName = string.Join(" ", nameParts[1..]);
        
        return (firstName, lastName);
    }

    public static int? ParseAge(string ageString)
    {
        if (string.IsNullOrWhiteSpace(ageString))
            return null;

        var match = AgeRegex.Match(ageString.Trim());
        if (match.Success && int.TryParse(match.Groups[1].Value, out int age))
        {
            // Validate reasonable age range
            if (age >= 0 && age <= 150)
                return age;
        }

        return null;
    }

    public static string CleanPhoneNumber(string phoneNumber)
    {
        if (string.IsNullOrWhiteSpace(phoneNumber))
            return string.Empty;

        // Remove all non-digit characters except +
        var cleaned = PhoneRegex.Replace(phoneNumber.Trim(), "");
        
        // Ensure it starts with + for international numbers if it looks like one
        if (cleaned.Length == 10 && !cleaned.StartsWith("+"))
            cleaned = "+91" + cleaned; // Default to India country code
        
        // Validate length
        if (cleaned.Length >= 10 && cleaned.Length <= 15)
            return cleaned;
        
        return phoneNumber.Trim(); // Return original if we can't clean it properly
    }

    public static Gender ParseGender(string genderString)
    {
        if (string.IsNullOrWhiteSpace(genderString))
            return Gender.Other;

        var gender = genderString.Trim().ToLowerInvariant();
        
        return gender switch
        {
            "m" or "male" => Gender.Male,
            "f" or "female" => Gender.Female,
            _ => Gender.Other
        };
    }

    public static int? ParseYear(string yearString)
    {
        if (string.IsNullOrWhiteSpace(yearString))
            return null;

        // Try direct parsing first
        if (int.TryParse(yearString.Trim(), out int year))
        {
            if (year >= 1900 && year <= DateTime.UtcNow.Year + 1)
                return year;
        }

        // Try extracting year from date or other formats
        var match = YearRegex.Match(yearString);
        if (match.Success && int.TryParse(match.Groups[1].Value, out year))
        {
            if (year >= 1900 && year <= DateTime.UtcNow.Year + 1)
                return year;
        }

        return null;
    }

    public static DateTime? ParseDateLoggedIn(string dateString)
    {
        if (string.IsNullOrWhiteSpace(dateString))
            return null;

        // Handle various date formats
        var formats = new[]
        {
            "MM/dd/yyyy HH:mm:ss tt",
            "dd/MM/yyyy HH:mm:ss tt", 
            "yyyy-MM-dd HH:mm:ss",
            "MM/dd/yyyy",
            "dd/MM/yyyy",
            "yyyy-MM-dd",
            "MMMM dd",
            "MMMM ddth",
            "MMMM ddst",
            "MMMM ddnd",
            "MMMM ddrd"
        };

        // Clean up ordinal indicators
        var cleanDateString = Regex.Replace(dateString.Trim(), @"(\d+)(?:st|nd|rd|th)", "$1");

        foreach (var format in formats)
        {
            if (DateTime.TryParseExact(cleanDateString, format, CultureInfo.InvariantCulture, DateTimeStyles.None, out DateTime result))
            {
                // If year is missing, assume current year
                if (result.Year == 1)
                    result = result.AddYears(DateTime.UtcNow.Year - 1);
                
                return DateTime.SpecifyKind(result, DateTimeKind.Utc);
            }
        }

        // Try general parsing
        if (DateTime.TryParse(cleanDateString, out DateTime generalResult))
        {
            return DateTime.SpecifyKind(generalResult, DateTimeKind.Utc);
        }

        return null;
    }

    public static string CleanStage(string stageString)
    {
        if (string.IsNullOrWhiteSpace(stageString))
            return string.Empty;

        var stage = stageString.Trim();
        
        // Normalize common stage formats
        stage = Regex.Replace(stage, @"^stage\s*", "", RegexOptions.IgnoreCase);
        stage = stage.ToUpperInvariant();
        
        return stage;
    }

    public static DateTime EstimateDateOfBirth(int? age, int? registrationYear)
    {
        if (!age.HasValue)
            return DateTime.UtcNow.AddYears(-50); // Default to 50 years ago if no age

        var baseYear = registrationYear ?? DateTime.UtcNow.Year;
        var birthYear = baseYear - age.Value;
        
        return DateTime.SpecifyKind(new DateTime(birthYear, 1, 1), DateTimeKind.Utc); // Use January 1st as default
    }

    public static string GeneratePatientId(string originalMRN, string sheetName)
    {
        // Create a unique patient ID from MRN and sheet
        var prefix = GetSheetPrefix(sheetName);
        var cleanMRN = Regex.Replace(originalMRN, @"[^\d]", "");
        
        if (string.IsNullOrEmpty(cleanMRN))
            cleanMRN = DateTime.UtcNow.Ticks.ToString()[^6..]; // Use last 6 digits of ticks

        return $"{prefix}{cleanMRN}";
    }

    private static string GetSheetPrefix(string sheetName)
    {
        return sheetName.ToUpperInvariant() switch
        {
            "BREAST" => "BR",
            "LUNG" => "LU",
            "COLORECTAL" => "CR",
            "PROSTATE" => "PR",
            "CERVIX" => "CX",
            "OVARY" => "OV",
            "STOMACH" => "ST",
            "ADULT LEUKEMIA" => "AL",
            "LYMPHOMA" => "LY",
            "MYELOMA" => "MY",
            _ => "OT" // Other
        };
    }

    public static (string? city, string? state) ExtractCityState(string address)
    {
        if (string.IsNullOrWhiteSpace(address))
            return (null, null);

        // Look for common patterns like "BANGALORE 560032" or "BANGALORE"
        var patterns = new[]
        {
            @"BANGALORE\s*\d*",
            @"BENGALURU\s*\d*",
            @"MUMBAI\s*\d*",
            @"DELHI\s*\d*",
            @"CHENNAI\s*\d*",
            @"KOLKATA\s*\d*",
            @"HYDERABAD\s*\d*",
            @"PUNE\s*\d*"
        };

        foreach (var pattern in patterns)
        {
            var match = Regex.Match(address, pattern, RegexOptions.IgnoreCase);
            if (match.Success)
            {
                var cityMatch = match.Value.Trim();
                var city = Regex.Replace(cityMatch, @"\s*\d+.*$", "").Trim();
                
                return city.ToUpperInvariant() switch
                {
                    "BANGALORE" or "BENGALURU" => ("Bangalore", "Karnataka"),
                    "MUMBAI" => ("Mumbai", "Maharashtra"),
                    "DELHI" => ("Delhi", "Delhi"),
                    "CHENNAI" => ("Chennai", "Tamil Nadu"),
                    "KOLKATA" => ("Kolkata", "West Bengal"),
                    "HYDERABAD" => ("Hyderabad", "Telangana"),
                    "PUNE" => ("Pune", "Maharashtra"),
                    _ => (city, null)
                };
            }
        }

        // If we find "Karnataka" or other states, extract them
        var statePatterns = new[]
        {
            "KARNATAKA", "MAHARASHTRA", "TAMIL NADU", "WEST BENGAL", 
            "DELHI", "TELANGANA", "ANDHRA PRADESH", "KERALA", "GUJARAT"
        };

        foreach (var state in statePatterns)
        {
            if (address.ToUpperInvariant().Contains(state))
            {
                return (null, state.ToTitleCase());
            }
        }

        return (null, null);
    }
}

public static class StringExtensions
{
    public static string ToTitleCase(this string input)
    {
        if (string.IsNullOrWhiteSpace(input))
            return input;

        return CultureInfo.CurrentCulture.TextInfo.ToTitleCase(input.ToLowerInvariant());
    }
}