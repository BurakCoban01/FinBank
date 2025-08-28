using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace FinTrack.API.Migrations
{
    /// <inheritdoc />
    public partial class AddLoanDepositFeatures : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "TimeDeposits",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    UserId = table.Column<int>(type: "integer", nullable: false),
                    SourceAccountId = table.Column<int>(type: "integer", nullable: false),
                    PrincipalAmount = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    InterestRate = table.Column<decimal>(type: "numeric(5,4)", nullable: false),
                    StartDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    EndDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    MaturityAmount = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TimeDeposits", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TimeDeposits_Accounts_SourceAccountId",
                        column: x => x.SourceAccountId,
                        principalTable: "Accounts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_TimeDeposits_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_TimeDeposits_SourceAccountId",
                table: "TimeDeposits",
                column: "SourceAccountId");

            migrationBuilder.CreateIndex(
                name: "IX_TimeDeposits_UserId",
                table: "TimeDeposits",
                column: "UserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "TimeDeposits");
        }
    }
}
