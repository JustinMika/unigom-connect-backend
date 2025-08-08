import { sequelize } from "./config/database.config";
import "./models";
import logger from "./logger";

sequelize
	.sync({ force: true, alter: true })
	.then(() => {
		console.info("Database & tables created!");
		logger.info("Database & tables created!");
	})
	.catch((err) => {
		logger.error("Unable to sync the database:", err);
		process.exit(1);
	});
