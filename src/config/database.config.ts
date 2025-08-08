import { Sequelize } from "sequelize";
import dotenv from "dotenv";
import logger from "../logger";
dotenv.config();

export const sequelize = new Sequelize({
	database: process.env.DB_NAME,
	dialect: "mysql",
	username: process.env.DB_USER,
	password: process.env.DB_PASSWORD,
	host: process.env.DB_HOST,
	port: Number(process.env.DB_PORT),
	logging: (sql, timing) => {
		logger.log("info", `${sql} (${timing}ms)`);
	},
	define: {
		timestamps: true,
		underscored: true,
		freezeTableName: true,
	},
});

export const connectToDatabase = async () => {
	try {
		await sequelize.authenticate();
		logger.log("info", "Connection to the database has been established successfully.");
	} catch (error) {
		logger.log("error", "Unable to connect to the database:", error);
	}
};
