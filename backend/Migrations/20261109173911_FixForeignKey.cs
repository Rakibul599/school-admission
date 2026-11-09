using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class FixForeignKey : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Holds_SchoolClasses_SchoolClassId",
                table: "Holds");

            migrationBuilder.DropIndex(
                name: "IX_Holds_SchoolClassId",
                table: "Holds");

            migrationBuilder.DropColumn(
                name: "SchoolClassId",
                table: "Holds");

            migrationBuilder.CreateIndex(
                name: "IX_Holds_ClassId",
                table: "Holds",
                column: "ClassId");

            migrationBuilder.AddForeignKey(
                name: "FK_Holds_SchoolClasses_ClassId",
                table: "Holds",
                column: "ClassId",
                principalTable: "SchoolClasses",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Holds_SchoolClasses_ClassId",
                table: "Holds");

            migrationBuilder.DropIndex(
                name: "IX_Holds_ClassId",
                table: "Holds");

            migrationBuilder.AddColumn<string>(
                name: "SchoolClassId",
                table: "Holds",
                type: "text",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Holds_SchoolClassId",
                table: "Holds",
                column: "SchoolClassId");

            migrationBuilder.AddForeignKey(
                name: "FK_Holds_SchoolClasses_SchoolClassId",
                table: "Holds",
                column: "SchoolClassId",
                principalTable: "SchoolClasses",
                principalColumn: "Id");
        }
    }
}
