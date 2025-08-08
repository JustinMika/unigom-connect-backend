// middlewares/checkPermission.ts
import { Request, Response, NextFunction } from "express";

import { Module } from "../models/Module";
import { Op } from "sequelize";
import { Component } from "../models/Component";
import { userComponent } from "../models/UserComponent";
import { userRole } from "../models/UserRole";
import { RoleComponent } from "../models/RoleComponent";

export const checkPermission = (componentPath: string) => {
	return async (req: Request, res: Response, next: NextFunction) => {
		const userId = (req as any).user?.id;
		if (!userId) {
			return res.status(401).json({ message: "Non autorisé" });
		}

		// 1. Trouver le composant demandé
		const component = await Component.findOne({
			where: { path: componentPath },
			include: [{ model: Module, as: "module" }],
		});

		if (!component) {
			return res.status(404).json({ message: "Composant introuvable" });
		}

		const componentId = component.id;

		// 2. Vérifier si l'utilisateur est chef du module
		const isChef = (component as any).module?.chefId && (component as any).module.chefId === userId;

		// 3. Vérifier si l'utilisateur a ce composant directement
		const hasManualAccess = await userComponent.findOne({
			where: { userId, componentId },
		});

		// 4. Vérifier si un de ses rôles contient ce composant
		const userRoles = await userRole.findAll({ where: { userId } });
		const roleIds = userRoles.map((r: any) => r.roleId);

		const hasViaRole = await RoleComponent.findOne({
			where: {
				roleId: { [Op.in]: roleIds },
				componentId,
			},
		});

		// 5. Si aucun accès → bloqué
		if (!isChef && !hasManualAccess && !hasViaRole) {
			return res.status(403).json({ message: "Accès refusé" });
		}

		next();
	};
};
