using PatientManagementApi.Models;

namespace DataMigration.Models;

public class ExcelPatientRecord
{
    public string SerialNumber { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string MRN { get; set; } = string.Empty;
    public string Year { get; set; } = string.Empty;
    public string Diagnosis { get; set; } = string.Empty;
    public string Stage { get; set; } = string.Empty;
    public string Age { get; set; } = string.Empty;
    public string Sex { get; set; } = string.Empty;
    public string ContactNo1 { get; set; } = string.Empty;
    public string ContactNo2 { get; set; } = string.Empty;
    public string ContactNo3 { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string DateLoggedIn { get; set; } = string.Empty;
    public string SheetName { get; set; } = string.Empty;
    public int RowNumber { get; set; }
}

public class ImportResult
{
    public int TotalRecords { get; set; }
    public int SuccessfulImports { get; set; }
    public int SkippedRecords { get; set; }
    public int Errors { get; set; }
    public List<string> ErrorMessages { get; set; } = new();
    public List<string> WarningMessages { get; set; } = new();
    public DateTime ImportStartTime { get; set; }
    public DateTime ImportEndTime { get; set; }
    public TimeSpan Duration => ImportEndTime - ImportStartTime;
}

public class SheetImportResult
{
    public string SheetName { get; set; } = string.Empty;
    public int TotalRecords { get; set; }
    public int SuccessfulImports { get; set; }
    public int SkippedRecords { get; set; }
    public int Errors { get; set; }
    public List<string> ErrorMessages { get; set; } = new();
    public List<string> WarningMessages { get; set; } = new();
    public CancerSiteType CancerSite { get; set; }
}

public static class CancerSiteMapping
{
    public static readonly Dictionary<string, CancerSiteType> SheetToCancerSite = new()
    {
        { "Breast", CancerSiteType.Breast },
        { "Lung", CancerSiteType.Lung },
        { "Colorectal", CancerSiteType.Colon },
        { "Prostate", CancerSiteType.Prostate },
        { "Cervix", CancerSiteType.Cervical },
        { "Ovary", CancerSiteType.Ovarian },
        { "Stomach", CancerSiteType.Stomach },
        { "Esophagus", CancerSiteType.Other },
        { "Head & neck", CancerSiteType.Other },
        { "Pancratio billiary", CancerSiteType.Pancreatic },
        { "HCC", CancerSiteType.Liver },
        { "Adult Leukemia", CancerSiteType.Blood },
        { "Lymphoma", CancerSiteType.Blood },
        { "Myeloma", CancerSiteType.Blood },
        { "MDS", CancerSiteType.Blood },
        { "MPN", CancerSiteType.Blood },
        { "Pediatric Leukemia", CancerSiteType.Blood },
        { "CNS tumors", CancerSiteType.Brain },
        { "Sarcoma", CancerSiteType.Other },
        { "THYROID", CancerSiteType.Other },
        { "Renal cell carcinoma", CancerSiteType.Kidney },
        { "Endometrium", CancerSiteType.Other },
        { "Neuroendocrine", CancerSiteType.Other },
        { "Unknown Primary", CancerSiteType.Other },
        { "Pediatric solid", CancerSiteType.Other },
        { "BONE TUMORS", CancerSiteType.Other },
        { "SKIN CANCER", CancerSiteType.Other },
        { "Geniatourinary Urinary bladar", CancerSiteType.Other },
        { "GTN", CancerSiteType.Other },
        { "Aplastic Anemia", CancerSiteType.Blood },
        { "RARE DISEASE", CancerSiteType.Other },
        { "Peutz Jeghers syndrome", CancerSiteType.Other },
        { "Waldenstrom Macroglobulinemia", CancerSiteType.Blood }
    };
    
    public static CancerSiteType GetCancerSite(string sheetName)
    {
        return SheetToCancerSite.GetValueOrDefault(sheetName, CancerSiteType.Other);
    }
}