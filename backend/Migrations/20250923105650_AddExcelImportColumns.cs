using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PatientManagementApi.Migrations
{
    /// <inheritdoc />
    public partial class AddExcelImportColumns : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "AgeAtDiagnosis",
                table: "Patients",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "DateLoggedIn",
                table: "Patients",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "ExcelRowNumber",
                table: "Patients",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ExcelSheetSource",
                table: "Patients",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "ImportedFromExcel",
                table: "Patients",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "OriginalMRN",
                table: "Patients",
                type: "character varying(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "RegistrationYear",
                table: "Patients",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SecondaryContactPhone",
                table: "Patients",
                type: "character varying(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SiteSpecificDiagnosis",
                table: "Patients",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TertiaryContactPhone",
                table: "Patients",
                type: "character varying(20)",
                maxLength: 20,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AgeAtDiagnosis",
                table: "Patients");

            migrationBuilder.DropColumn(
                name: "DateLoggedIn",
                table: "Patients");

            migrationBuilder.DropColumn(
                name: "ExcelRowNumber",
                table: "Patients");

            migrationBuilder.DropColumn(
                name: "ExcelSheetSource",
                table: "Patients");

            migrationBuilder.DropColumn(
                name: "ImportedFromExcel",
                table: "Patients");

            migrationBuilder.DropColumn(
                name: "OriginalMRN",
                table: "Patients");

            migrationBuilder.DropColumn(
                name: "RegistrationYear",
                table: "Patients");

            migrationBuilder.DropColumn(
                name: "SecondaryContactPhone",
                table: "Patients");

            migrationBuilder.DropColumn(
                name: "SiteSpecificDiagnosis",
                table: "Patients");

            migrationBuilder.DropColumn(
                name: "TertiaryContactPhone",
                table: "Patients");
        }
    }
}
