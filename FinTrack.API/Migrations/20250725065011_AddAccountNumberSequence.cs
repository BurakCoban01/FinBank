using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FinTrack.API.Migrations
{
    /// <inheritdoc />
    public partial class AddAccountNumberSequence : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateSequence(
                name: "account_number_seq",
                startValue: 1L,
                incrementBy: 1);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropSequence(
                name: "account_number_seq");
        }
    }
}
