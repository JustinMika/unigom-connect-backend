const fs = require("fs");
const path = require("path");

const [, , modelName] = process.argv;
if (!modelName) {
	console.error("Usage: node generate-model.js ModelName");
	process.exit(1);
}

const modelTemplate = `
import { Model, DataTypes, Sequelize, Optional } from 'sequelize';
import sequelize from ".";

interface ${modelName}Attributes {
  id: number;
  // Ajoute ici tes champs
}

interface ${modelName}CreationAttributes extends Optional<${modelName}Attributes, 'id'> {}

export class ${modelName} extends Model<${modelName}Attributes, ${modelName}CreationAttributes> implements ${modelName}Attributes {
  public id!: number;
  // Ajoute ici tes champs

  static associate(models: any) {
    // define association here
  }
}

${modelName}.init(
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      // Ajoute ici tes champs
    },
    {
      sequelize,
      modelName: '${modelName}',
      tableName: '${modelName.toLowerCase()}s',
    }
  );
export default ${modelName};
`;
const datePrefix = new Date()
	.toISOString()
	.replace(/[-T:\.Z]/g, "")
	.slice(0, 14);
const migrationTemplate = `
import { QueryInterface, DataTypes } from 'sequelize';

module.exports = {
  async up(queryInterface: QueryInterface) {
    await queryInterface.createTable('${modelName.toLowerCase()}s', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER.UNSIGNED,
      },
      // Ajoute ici tes champs
      createdAt: {
        allowNull: false,
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      updatedAt: {
        allowNull: false,
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    });
  },
  async down(queryInterface: QueryInterface) {
    await queryInterface.dropTable('${modelName.toLowerCase()}s');
  },
};
`;

fs.writeFileSync(path.join("src/models", `${modelName}.ts`), modelTemplate.trim());
fs.writeFileSync(
	path.join("src/migrations", `${datePrefix}-create-${modelName.toLowerCase()}.ts`),
	migrationTemplate.trim(),
);

console.log(`Model and migration for ${modelName} created!`);
