import { createServer as createHttpServer } from "http";
import { readFileSync } from "fs";
import app from "./app";
import { HOST, PORT } from "./config/app.config";
import sequelize from "./models";

// Charger le certificat
// const httpOptions = {
// 	key: readFileSync("./ssl/key.pem"),
// 	cert: readFileSync("./ssl/cert.pem"),
// };

const server = createHttpServer(app);

// Tester la connectivité de la base de données
sequelize
	.authenticate()
	.then(() => {
		console.info("Connection to the database has been established successfully.");
	})
	.catch(() => {
		console.error("Unable to connect to the database:");
	});

server.listen(PORT, () => {
	console.info(`🔐 Server running at https://${HOST}:${PORT}`);
	console.info(`📚 Docs available at https://${HOST}:${PORT}/v1/api-docs/`);
});
