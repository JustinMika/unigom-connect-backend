import dotenv from "dotenv";
dotenv.config();

const isProduction = process.env.NODE_ENV === "production";
const HOST_URL = process.env.HOST_URL ?? "localhost";

export const swaggerDocument = {
	openapi: "3.0.0",
	info: {
		title: "API Documentation",
		version: "1.0.0",
		description: "API documentation for the application : Hospital unigom",
	},
	servers: [
		{
			url: isProduction ? "http://api.citecivil.unigom.ac.cd/v1/" : `${HOST_URL}/v1/`,
			description: isProduction ? "Serveur de production" : "Serveur de développement",
		},
	],
	paths: {},
};
