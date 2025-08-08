import { AuditService } from "../services/audit.service";
import { User } from "../models/User";
import sequelize from "../models/index";

async function seedAuditLogs() {
	try {
		await sequelize.authenticate();
		console.log("Connexion à la base de données établie.");

		// Récupérer un utilisateur existant pour les tests
		const users = await User.findAll({ limit: 5 });
		if (users.length === 0) {
			console.log("Aucun utilisateur trouvé. Création d'un utilisateur de test...");
			const testUser = await User.create({
				email: "admin@unigom.ac.cd",
				password: "password123",
				roleId: 1,
				agentId: 1,
				isActive: true,
			});
			users.push(testUser);
		}

		const adminUser = users[0];

		// Données de test pour les logs d'audit
		const testLogs = [
			{
				action: "user_role_assigned",
				actor: adminUser.id,
				details: {
					targetType: "user",
					targetName: "Dr. Mukamba Jean",
					targetEmail: "mukamba@unigom.ac.cd",
					role: "Directeur RH",
					module: "rh",
					previous: null,
				},
				ipAddress: "192.168.1.100",
				userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
			},
			{
				action: "module_deactivated",
				actor: adminUser.id,
				details: {
					targetType: "module",
					targetName: "Module Logement",
					targetSlug: "logement",
					reason: "Maintenance programmée",
					previous: { active: true },
				},
				ipAddress: "192.168.1.100",
				userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
			},
			{
				action: "user_component_granted",
				actor: adminUser.id,
				details: {
					targetType: "user",
					targetName: "Prof. Ndaya Grace",
					targetEmail: "ndaya@unigom.ac.cd",
					component: "Validation congés",
					module: "rh",
					previous: null,
				},
				ipAddress: "192.168.1.105",
				userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
			},
			{
				action: "role_created",
				actor: adminUser.id,
				details: {
					targetType: "role",
					targetName: "Consultant Archives",
					module: "archivage",
					permissions: ["documents-read", "recherche-avancee"],
					description: "Accès en lecture aux archives",
				},
				ipAddress: "192.168.1.100",
				userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
			},
			{
				action: "module_chef_assigned",
				actor: adminUser.id,
				details: {
					targetType: "module",
					targetName: "Module Patrimoine",
					targetSlug: "patrimoine",
					newChef: "Mme. Kavira Marie",
					previousChef: "M. Bahati Paul",
				},
				ipAddress: "192.168.1.100",
				userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
			},
			{
				action: "user_role_revoked",
				actor: adminUser.id,
				details: {
					targetType: "user",
					targetName: "M. Furaha Paul",
					targetEmail: "furaha.p@unigom.ac.cd",
					role: "Agent RH",
					module: "rh",
					reason: "Fin de contrat",
				},
				ipAddress: "192.168.1.105",
				userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
			},
			{
				action: "component_created",
				actor: adminUser.id,
				details: {
					targetType: "component",
					targetName: "Rapport de performance",
					path: "/rh/rapports/performance",
					module: "rh",
					order: 8,
					description: "Génération de rapports de performance",
				},
				ipAddress: "192.168.1.100",
				userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
			},
			{
				action: "module_updated",
				actor: adminUser.id,
				details: {
					targetType: "module",
					targetName: "Module RH",
					targetSlug: "rh",
					changes: {
						description: {
							from: "Gestion du personnel",
							to: "Gestion complète des ressources humaines",
						},
					},
				},
				ipAddress: "192.168.1.100",
				userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
			},
		];

		// Créer les logs d'audit
		for (const logData of testLogs) {
			await AuditService.createAuditLog(logData);
		}

		console.log(`${testLogs.length} logs d'audit de test créés avec succès.`);
	} catch (error) {
		console.error("Erreur lors de la création des logs d'audit:", error);
	} finally {
		await sequelize.close();
	}
}

// Exécuter le script si appelé directement
if (require.main === module) {
	seedAuditLogs();
}

export default seedAuditLogs;
