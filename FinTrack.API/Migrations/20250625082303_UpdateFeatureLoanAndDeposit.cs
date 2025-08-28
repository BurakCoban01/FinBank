using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace FinTrack.API.Migrations
{
    /// <inheritdoc />
    public partial class UpdateFeatureLoanAndDeposit : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "MaturityAction",
                table: "TimeDeposits",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateTable(
                name: "Loans",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    UserId = table.Column<int>(type: "integer", nullable: false),
                    TargetAccountId = table.Column<int>(type: "integer", nullable: false),
                    LoanType = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    PrincipalAmount = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    InterestRate = table.Column<decimal>(type: "numeric(5,4)", nullable: false),
                    TermInMonths = table.Column<int>(type: "integer", nullable: false),
                    MonthlyPayment = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    TotalRepayment = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    StartDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Loans", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Loans_Accounts_TargetAccountId",
                        column: x => x.TargetAccountId,
                        principalTable: "Accounts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Loans_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Loans_TargetAccountId",
                table: "Loans",
                column: "TargetAccountId");

            migrationBuilder.CreateIndex(
                name: "IX_Loans_UserId",
                table: "Loans",
                column: "UserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Loans");

            migrationBuilder.DropColumn(
                name: "MaturityAction",
                table: "TimeDeposits");
        }
    }
}
