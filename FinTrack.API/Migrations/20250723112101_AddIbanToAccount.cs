using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FinTrack.API.Migrations
{
    /// <inheritdoc />
    public partial class AddIbanToAccount : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Iban",
                table: "Accounts",
                type: "text",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Iban",
                table: "Accounts");
        }
    }
}
