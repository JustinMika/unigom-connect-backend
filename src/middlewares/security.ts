/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response, NextFunction } from "express";

// Middleware pour gérer les erreurs CSRF
export function handleCsrfError(err: Error, req: Request, res: Response, next: NextFunction) {
	if (typeof (err as any).code === "string" && (err as any).code === "EBADCSRFTOKEN") {
		res.status(403).json({ message: "CSRF token invalide." });
		return;
	}
	next(err);
}
