// @typescript-eslint/no-unused-vars
import cookieParser from "cookie-parser";
import cors from "cors";
import express, { Application, Request, Response } from "express";
import helmet from "helmet";
import httpLogger from "./middlewares/httpLogger";
import logger from "./logger";
import rateLimit from "express-rate-limit";
import { routeLogger } from "./middlewares/routeLogger";
import filtersRoutes from "./routes/filters.routes";
import { routes } from "./routes/index.route";
import swaggerUi from "swagger-ui-express";
import { swaggerDocument } from "./config/swagger";

const app: Application = express();

// Limiteur de requêtes (100 requêtes / 2 min)
const limiter = rateLimit({
	windowMs: 10 * 60 * 1000,
	max: 100000,
	message: "Trop de requêtes depuis cette IP, réessayez plus tard.",
});

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static("public"));
app.use("/uploads", express.static("uploads"));
app.use(httpLogger);
app.use(routeLogger);
app.use(
	helmet({
		contentSecurityPolicy: false, // Désactive CSP si besoin de compatibilité
		crossOriginResourcePolicy: { policy: "cross-origin" },
	}),
);

app.use(
	cors({
		origin: ["localhost:3000", "http://localhost:3000", "http://127.0.0.1:3000"], // Autorise ces origines
		methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
		allowedHeaders: ["Content-Type", "Authorization", "X-CSRF-Token", "Content-Disposition"],
		exposedHeaders: ["Content-Disposition", "Content-Length", "Content-Type"],
		credentials: true, // Autorise les cookies et headers d'authentification
		optionsSuccessStatus: 204,
	}),
);
app.use(limiter);

// Middleware pour gérer les erreurs de parsing JSON
app.use((err: Error, _req: Request, res: Response, next: express.NextFunction) => {
	if (err instanceof SyntaxError && "body" in err) {
		logger.error(`Erreur de parsing JSON: ${err.message}`);
		res.status(400).json({
			error: "JSON invalide",
			message: "Le corps de la requête contient un JSON invalide",
		});
		return;
	}
	next(err);
});

app.get("/", (req: Request, res: Response) => {
	res.status(200).json({
		message: "👋 Welcome to Unigom Hospital API",
		url: req.url,
		version: "1.0.0",
		api: "v1",
		authors: ["Justin Micah"],
		license: "MIT",
		contact: {
			email: "justinmika@gmail.com",
			github: "https://github.com/JustinMika",
		},
	});
});

app.use("/api/v1/", routes);
app.use("/api/v1/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use((req: Request, res: Response) => {
	logger.error("404 not found");
	res.status(404).json({ message: "404 route not found", url: req.url }).end();
});

app.use((err: Error, req: Request, res: Response) => {
	logger.error(`Unhandled Error: ${err.message}`);
	res.status(500).json("Internal Server Error");
});

// Gérer les autres erreurs
app.use(
	(err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
		if (err instanceof Error) {
			logger.error(`Unhandled Error: ${err.message}`);
		} else {
			logger.error("Unhandled non-Error exception");
		}
		res.status(500).json({ message: "Erreur serveur" });
	},
);

export default app;
