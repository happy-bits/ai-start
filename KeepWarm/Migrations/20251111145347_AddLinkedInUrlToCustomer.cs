using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace KeepWarm.Migrations
{
    /// <inheritdoc />
    public partial class AddLinkedInUrlToCustomer : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "LinkedInUrl",
                table: "Customers",
                type: "TEXT",
                maxLength: 255,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "LinkedInUrl",
                table: "Customers");
        }
    }
}
