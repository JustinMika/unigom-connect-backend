const fs = require("fs");
const path = require("path");

const [, , migrationName, tableName, ...columns] = process.argv;
if (!migrationName || !tableName || columns.length === 0) {
	console.error(
		"Usage: node generate-migration.js MigrationName TableName col1:TYPE col2:TYPE ...",
	);
	process.exit(1);
}

const datePrefix = new Date()
	.toISOString()
	.replace(/[-T:/\.Z]/g, "")
	.slice(0, 14);
const fileName = `${datePrefix}-${migrationName}.ts`;

// Génère les lignes d'ajout de colonnes
const upLines = columns
	.map((col) => {
		const [colName, colType] = col.split(":");
		if (!colName || !colType) {
			console.error("Chaque colonne doit être sous la forme nom:TYPE");
			process.exit(1);
		}
		return `    await queryInterface.addColumn('${tableName}', '${colName}', {\n      type: DataTypes.${colType.toUpperCase()}\n      // Ajoute ici d'autres options si besoin (allowNull, defaultValue, etc.)\n    });`;
	})
	.join("\n");

// Génère les lignes de suppression de colonnes
const downLines = columns
	.map((col) => {
		const [colName] = col.split(":");
		return `    await queryInterface.removeColumn('${tableName}', '${colName}');`;
	})
	.join("\n");

const migrationTemplate = `import { QueryInterface, DataTypes } from 'sequelize';

module.exports = {
  async up(queryInterface: QueryInterface) {
${upLines}
  },
  async down(queryInterface: QueryInterface) {
${downLines}
  },
};
`;

fs.writeFileSync(path.join("src/migrations", fileName), migrationTemplate.trim());

console.log(`Migration ${fileName} created!`);
