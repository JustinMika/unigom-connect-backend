// middlewares/checkPermissionById.ts
import { Request, Response, NextFunction } from "express";
import { Component } from "../models/Component";
import { Module } from "../models/Module";
import { Op } from "sequelize";
import { userComponent } from "../models/UserComponent";
import { userRole } from "../models/UserRole";
import { RoleComponent } from "../models/RoleComponent";

export const checkPermissionById = (componentId: number) => {
	return async (req: Request, res: Response, next: NextFunction) => {
		const userId = (req as any).user?.id;
		if (!userId) {
			return res.status(401).json({ message: "Non autorisé" });
		}

		// 1. Charger le composant avec son module
		const component = await Component.findOne({
			where: { id: componentId },
			include: [{ model: Module, as: "module" }],
		});

		if (!component) {
			return res.status(404).json({ message: "Composant introuvable" });
		}

		const moduleId = (component as any).module?.id;

		// 2. Vérifier si l'utilisateur est chef du module
		const isChef = (component as any).module?.chefId === userId;

		// 3. Vérifier accès manuel
		const hasManualAccess = await userComponent.findOne({
			where: { userId, componentId },
		});

		// 4. Vérifier accès via rôle
		const userRoles = await userRole.findAll({ where: { userId } });
		const roleIds = userRoles.map((r) => r.roleId);

		const hasViaRole = await RoleComponent.findOne({
			where: {
				roleId: { [Op.in]: roleIds },
				componentId,
			},
		});

		// 5. Si pas d’accès => 403
		if (!isChef && !hasManualAccess && !hasViaRole) {
			return res.status(403).json({ message: "Accès refusé" });
		}

		next();
	};
};
