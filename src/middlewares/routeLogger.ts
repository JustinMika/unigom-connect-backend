// middlewares/routeLogger.ts
import { Request, Response, NextFunction } from "express";
import logger from "../logger";

export const routeLogger = (req: Request, _res: Response, next: NextFunction) => {
	logger.info(`[${req.method}] ${req.originalUrl} - IP: ${req.ip}`);
	next();
};
