import { Model, DataTypes, Sequelize, Optional } from "sequelize";
import { User } from "./User";
import { Role } from "./Role";
import sequelize from ".";

interface userRoleAttributes {
	id: number;
	userId: number;
	roleId: number;
	moduleId: number | null;
	assignedBy: string;
	note: string;
}

interface userRoleCreationAttributes extends Optional<userRoleAttributes, "id"> {}

export class userRole
	extends Model<userRoleAttributes, userRoleCreationAttributes>
	implements userRoleAttributes
{
	public id!: number;
	public userId!: number;
	public roleId!: number;
	public moduleId!: number | null;
	public assignedBy!: string;
	public note!: string;
}

userRole.init(
	{
		id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
		userId: {
			type: DataTypes.INTEGER.UNSIGNED,
			allowNull: false,
			references: { model: "users", key: "id" },
		},
		roleId: {
			type: DataTypes.INTEGER.UNSIGNED,
			allowNull: false,
			references: { model: "roles", key: "id" },
		},
		moduleId: {
			type: DataTypes.INTEGER.UNSIGNED,
			allowNull: true,
			references: { model: "modules", key: "id" },
		},
		assignedBy: { type: DataTypes.STRING },
		note: { type: DataTypes.STRING },
	},
	{
		sequelize,
		modelName: "userRole",
		tableName: "userroles",
	},
);
export default userRole;
