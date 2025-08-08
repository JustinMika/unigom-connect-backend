/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response, NextFunction } from "express";

export const adminMiddleware = (req: Request, res: Response, next: NextFunction) => {
	if (!(req as any).user) {
		// Vérifiez si l'utilisateur dans la requete
		return res.status(403).json({ error: "Accès refusé. Autorisation requise." });
	}
	next();
};
