import jwt, { JwtPayload } from "jsonwebtoken";
import "dotenv/config";
import User from "../models/User";
import { Request, Response, NextFunction } from "express";
import Role from "../models/Role";
import Agent from "../models/Agent";
import userComponent from "../models/UserComponent";
import Module from "../models/Module";

const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
	const token = req.header("Authorization")?.replace("Bearer ", "");
	// Vérifiez si le token est présent
	if (!token) {
		res.status(401).json({ error: "Accès refusé. Token manquant." });
		return;
	}

	try {
		// Vérifiez et décodez le token
		const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload;

		// Récupérer l'utilisateur à partir de la base de données
		const user = await User.findByPk(decoded.id, {
			include: [
				{
					model: Role,
					as: "role",
				},
				{
					model: Agent,
					as: "agent",
				},
				{
					model: userComponent,
					as: "userComponents",
				},
				{
					model: Module,
					as: "modulesAsChef",
				},
			],
		});

		// Vérifiez si l'utilisateur existe
		if (!user) {
			res.status(401).json({ error: "Utilisateur non trouvé." });
			return;
		}

		// Vous pouvez vérifier si l'utilisateur est actif
		if (!user.isActive) {
			res.status(403).json({ error: "Utilisateur bloqué." });
		}

		// Ajoutez l'utilisateur à la requête pour une utilisation ultérieure
		(req as any).user = user;
		(req as any).userId = user.id;

		// Passer au middleware suivant
		next();
	} catch (error: any) {
		// Gérer différents types d'erreurs
		if (error.name === "JsonWebTokenError") {
			res.status(401).json({ error: "Token invalide." });
		} else if (error.name === "TokenExpiredError") {
			res.status(401).json({ error: "Token expiré." });
		} else {
			res.status(500).json({
				message: "Erreur interne du serveur",
				error: (error as Error).message,
			});
		}
	}
};

export default authMiddleware;
