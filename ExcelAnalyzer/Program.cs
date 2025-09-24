using ClosedXML.Excel;
using System.Text.Json;

namespace ExcelAnalyzer;

class Program
{
    static void Main(string[] args)
    {
        try
        {
            string excelFilePath = "../Site wise Data collection.xlsx";
            
            if (!File.Exists(excelFilePath))
            {
                Console.WriteLine($"Excel file not found at: {excelFilePath}");
                return;
            }

            Console.WriteLine("=== Excel File Analysis ===");
            Console.WriteLine($"File: {excelFilePath}");
            Console.WriteLine();

            using var workbook = new XLWorkbook(excelFilePath);
            
            Console.WriteLine($"Number of worksheets: {workbook.Worksheets.Count}");
            Console.WriteLine();

            foreach (var worksheet in workbook.Worksheets)
            {
                AnalyzeWorksheet(worksheet);
                Console.WriteLine();
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error: {ex.Message}");
        }
    }

    static void AnalyzeWorksheet(IXLWorksheet worksheet)
    {
        Console.WriteLine($"=== Worksheet: {worksheet.Name} ===");
        
        var usedRange = worksheet.RangeUsed();
        if (usedRange == null)
        {
            Console.WriteLine("Worksheet is empty");
            return;
        }

        Console.WriteLine($"Used range: {usedRange.FirstCell().Address} to {usedRange.LastCell().Address}");
        Console.WriteLine($"Rows: {usedRange.RowCount()}, Columns: {usedRange.ColumnCount()}");
        Console.WriteLine();

        // Get column headers (first row)
        Console.WriteLine("Column Headers:");
        var headerRow = usedRange.FirstRow();
        var headers = new List<string>();
        
        for (int col = 1; col <= usedRange.ColumnCount(); col++)
        {
            var header = headerRow.Cell(col).GetString().Trim();
            headers.Add(header);
            Console.WriteLine($"  {col}. {header}");
        }
        Console.WriteLine();

        // Show first few data rows
        Console.WriteLine("Sample Data (first 3 rows):");
        for (int row = 2; row <= Math.Min(4, usedRange.RowCount()); row++)
        {
            Console.WriteLine($"Row {row}:");
            var dataRow = usedRange.Row(row);
            for (int col = 1; col <= usedRange.ColumnCount(); col++)
            {
                var cellValue = dataRow.Cell(col).GetString().Trim();
                Console.WriteLine($"  {headers[col - 1]}: {cellValue}");
            }
            Console.WriteLine();
        }

        // Analyze data types and patterns
        Console.WriteLine("Column Analysis:");
        for (int col = 1; col <= usedRange.ColumnCount(); col++)
        {
            var header = headers[col - 1];
            var sampleValues = new List<string>();
            
            for (int row = 2; row <= Math.Min(10, usedRange.RowCount()); row++)
            {
                var value = usedRange.Cell(row, col).GetString().Trim();
                if (!string.IsNullOrEmpty(value) && !sampleValues.Contains(value))
                {
                    sampleValues.Add(value);
                }
            }
            
            Console.WriteLine($"  {header}:");
            Console.WriteLine($"    Sample values: {string.Join(", ", sampleValues.Take(5))}");
            
            // Try to identify data type
            var dataType = IdentifyDataType(sampleValues);
            Console.WriteLine($"    Suggested type: {dataType}");
        }
    }

    static string IdentifyDataType(List<string> sampleValues)
    {
        if (sampleValues.Count == 0) return "String";
        
        var nonEmptyValues = sampleValues.Where(v => !string.IsNullOrWhiteSpace(v)).ToList();
        if (nonEmptyValues.Count == 0) return "String";

        // Check if all values are integers
        if (nonEmptyValues.All(v => int.TryParse(v, out _)))
            return "Integer";

        // Check if all values are decimals
        if (nonEmptyValues.All(v => decimal.TryParse(v, out _)))
            return "Decimal";

        // Check if all values are dates
        if (nonEmptyValues.All(v => DateTime.TryParse(v, out _)))
            return "DateTime";

        // Check if all values are yes/no or true/false
        var booleanValues = new[] { "yes", "no", "true", "false", "y", "n", "1", "0" };
        if (nonEmptyValues.All(v => booleanValues.Contains(v.ToLowerInvariant())))
            return "Boolean";

        // Check for phone numbers
        if (nonEmptyValues.Any(v => v.StartsWith("+") || (v.Length >= 10 && v.All(c => char.IsDigit(c) || c == '-' || c == ' ' || c == '(' || c == ')'))))
            return "Phone";

        // Check for email addresses
        if (nonEmptyValues.Any(v => v.Contains("@") && v.Contains(".")))
            return "Email";

        return "String";
    }
}