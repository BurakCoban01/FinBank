using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FinTrack.API.Migrations
{
    /// <inheritdoc />
    public partial class AddIbanUniquenessAndSequence : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // IBAN üretimi için benzersiz sayı üretecek bir sequence oluştur (eğer yoksa).
            migrationBuilder.Sql(
                sql: @"
                CREATE SEQUENCE IF NOT EXISTS account_number_seq
                START 1
                INCREMENT 1
                NO MINVALUE
                NO MAXVALUE
                CACHE 10;",
                suppressTransaction: false);

            // Mevcut IBAN'ı olmayan hesaplara boş bir string ata.
            migrationBuilder.Sql(
                sql: @"UPDATE ""Accounts"" SET ""Iban"" = '' WHERE ""Iban"" IS NULL;",
                suppressTransaction: false);

            // IBAN kolonunu nullable olmayacak şekilde değiştir.
            migrationBuilder.AlterColumn<string>(
                name: "Iban",
                table: "Accounts",
                type: "character varying(34)",
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);

            // Her ihtimale karşı, migration'ın tekrar çalışabilmesi için önce mevcut index'i sil.
            migrationBuilder.Sql(@"DROP INDEX IF EXISTS ""IX_Accounts_Iban"";");

            // IBAN kolonuna PARTIAL UNIQUE kısıtlaması ekle.
            // Bu, boş string ('') olan IBAN'ları yoksayar ve sadece dolu olanların benzersiz olmasını zorunlu kılar.
            migrationBuilder.Sql(@"
                CREATE UNIQUE INDEX ""IX_Accounts_Iban""
                ON ""Accounts"" (""Iban"")
                WHERE ""Iban"" <> '';
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // UNIQUE kısıtlamasını kaldır.
            migrationBuilder.DropIndex(
                name: "IX_Accounts_Iban",
                table: "Accounts");

            // Sequence'i kaldır (eğer varsa).
            migrationBuilder.Sql(
                sql: "DROP SEQUENCE IF EXISTS account_number_seq;",
                suppressTransaction: false);

            // IBAN kolonunu tekrar nullable yap.
            migrationBuilder.AlterColumn<string>(
                name: "Iban",
                table: "Accounts",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(34)",
                oldNullable: false);
        }
    }
}
