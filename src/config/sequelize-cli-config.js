//  @typescript-eslint/no-require-imports
const dotenv = require("dotenv");
dotenv.config();

const commonConfig = {
	dialect: "mysql",
	username: process.env.DB_USER,
	password: process.env.DB_PASSWORD,
	database: process.env.DB_NAME,
	host: process.env.DB_HOST,
	port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
};

module.exports = {
	development: {
		...commonConfig,
		database: process.env.DB_NAME || "database_development",
	},
	test: {
		...commonConfig,
		database: process.env.DB_NAME_TEST || "database_test",
	},
	production: {
		...commonConfig,
		database: process.env.DB_NAME_PROD || "database_production",
	},
};
