import "dotenv/config";
import Role from "../models/Role";
import Module from "../models/Module";
import Component from "../models/Component";
import Agent from "../models/Agent";
import User from "../models/User";
import Affectation from "../models/Affectation";
import CategorieAgent from "../models/CategorieAgent";
import GradeAgent from "../models/GradeAgent";
import PosteAgent from "../models/PosteAgent";
import { Remuneration, RemunerationCreationAttributes } from "../models/Remuneration";
import Retraite, { RetraiteCreationAttributes } from "../models/Retraite";
import { PersonnelMovement } from "../models/PersonnelMovement";
import {
	Recrutement,
	RecrutementCreationAttributes,
	RecrutementAttributes,
} from "../models/Recrutement";
import Reclammation, { ReclammationCreationAttributes } from "../models/Reclammation";
import DirectionAgent from "../models/DirectionAgent";
import TaskForecast from "../models/TaskForecast";
import {
	Conges,
	Discipline,
	PretRetenu,
	Promotion,
	RoleComponent,
	Training,
	userComponent,
} from "../models/initModel";
import Evaluation from "../models/Evaluation";
import DocumentRessourceHumaine, {
	DocumentRessourceHumaineAttributes,
	DocumentRessourceHumaineCreationAttributes,
} from "../models/DocumentRessourceHumaine";
import SocialSupport, {
	SocialSupportAttributes,
	SocialSupportCreationAttributes,
} from "../models/SocialSupport";
import { sidebarItems } from "../../../frontend/data/sidebarItems";
import { connectToDatabase } from "../config/database.config";

const slugify = (text: string) => {
	return text
		.toString()
		.toLowerCase()
		.replace(/\s+/g, "-") // Replace spaces with -
		.replace(/[^\w\-]+/g, "") // Remove all non-word chars
		.replace(/\-\-+/g, "-") // Replace multiple - with single -
		.replace(/^-+/, "") // Trim - from start of text
		.replace(/-+$/, ""); // Trim - from end of text
};

async function seedAffectations() {
	console.log(`\n=== Création des affectations ===`);
	const affectations: { nom: string }[] = [
		{ nom: "Rectorat" },
		{ nom: "SGAD" },
		{ nom: "SGAC" },
		{ nom: "SGR" },
		{ nom: "Faculté de Médecine" },
		{ nom: "Faculté de Droit" },
	];
	for (const item of affectations) {
		await Affectation.findOrCreate({ where: { nom: item.nom }, defaults: item });
	}
	console.log(`✅ Affectations créées/vérifiées.`);
}

async function seedCategories() {
	console.log(`\n=== Création des catégories d'agents ===`);
	const categories: { nom: string }[] = [
		{ nom: "PE" },
		{ nom: "PO" },
		{ nom: "P" },
		{ nom: "PA" },
		{ nom: "CT" },
		{ nom: "Ass" },
		{ nom: "ATA1" },
		{ nom: "AA1" },
	];
	for (const item of categories) {
		await CategorieAgent.findOrCreate({
			where: { nom: item.nom },
			defaults: { nom: item.nom as any },
		});
	}
	console.log(`✅ Catégories créées/vérifiées.`);
}

async function seedGrades() {
	console.log(`\n=== Création des grades ===`);
	const grades: { nom: string }[] = [
		{ nom: "Professeur Ordinaire" },
		{ nom: "Chef de Travaux" },
		{ nom: "Assistant" },
		{ nom: "Agent Administratif Niveau 1" },
		{ nom: "Technicien Supérieur" },
	];
	for (const item of grades) {
		await GradeAgent.findOrCreate({ where: { nom: item.nom }, defaults: { nom: item.nom as any } });
	}
	console.log(`✅ Grades créés/vérifiés.`);
}

async function seedPostes() {
	console.log(`\n=== Création des postes ===`);
	const postes: { nom: string }[] = [
		{ nom: "Directeur du Personnel" },
		{ nom: "Directeur du patrimoine" },
		{ nom: "Appariteur" },
		{ nom: "Chargé de scolarité" },
		{ nom: "Chargé de bibliothèque" },
	];
	for (const item of postes) {
		await PosteAgent.findOrCreate({ where: { nom: item.nom }, defaults: { nom: item.nom as any } });
	}
	console.log(`✅ Postes créés/vérifiés.`);
}

async function assignRolesToComponents(
	roleNames: string[],
	componentNames: string[],
	moduleId?: number,
) {
	console.log(`\n=== Affectation des rôles aux composants ===`);

	// Charger les IDs des rôles
	const roles = await Role.findAll({ where: { name: roleNames } });
	if (roles.length !== roleNames.length) {
		console.log(`⚠️  Attention: ${roleNames.length - roles.length} rôles non trouvés`);
	}

	// Charger les IDs des composants
	const whereClause: { name: string[]; moduleId?: number } = { name: componentNames };
	if (moduleId) {
		whereClause.moduleId = moduleId;
	}
	const components = await Component.findAll({ where: whereClause });
	if (components.length !== componentNames.length) {
		console.log(
			`⚠️  Attention: ${componentNames.length - components.length} composants non trouvés`,
		);
	}

	// Créer les relations
	let created = 0;
	let existing = 0;

	for (const role of roles) {
		for (const component of components) {
			const alreadyExists = await RoleComponent.findOne({
				where: { roleId: role.id, componentId: component.id },
			});

			if (!alreadyExists) {
				await RoleComponent.create({
					roleId: role.id,
					componentId: component.id,
				});
				console.log(`✅ Rôle '${role.name}' → Composant '${component.name}'`);
				created++;
			} else {
				console.log(`⏭️  Rôle '${role.name}' → Composant '${component.name}' (déjà existant)`);
				existing++;
			}
		}
	}

	console.log(
		`\n📊 Résumé: ${created} nouvelles relations créées, ${existing} relations existantes`,
	);
}

async function seedConges() {
	console.log(`\n=== Création des données de congés ===`);

	const agents = await Agent.findAll();
	if (agents.length === 0) {
		console.log("⚠️  Aucun agent trouvé, impossible de créer des congés.");
		return;
	}

	const typesConges: ("Reconstitution" | "Circonstance" | "Autres")[] = [
		"Reconstitution",
		"Circonstance",
		"Autres",
	];
	const statuts: ("en attente" | "approuve" | "rejete")[] = ["en attente", "approuve", "rejete"];

	let createdCount = 0;

	// Créer 50 demandes de congé pour des agents aléatoires
	for (let i = 0; i < 50; i++) {
		const agent = agents[Math.floor(Math.random() * agents.length)];

		// S'assurer que l'approbateur et le remplaçant ne sont pas l'agent lui-même
		let approver = agents[Math.floor(Math.random() * agents.length)];
		while (approver.id === agent.id) {
			approver = agents[Math.floor(Math.random() * agents.length)];
		}

		let replacer = agents[Math.floor(Math.random() * agents.length)];
		while (replacer.id === agent.id || replacer.id === approver.id) {
			replacer = agents[Math.floor(Math.random() * agents.length)];
		}

		const statut = statuts[Math.floor(Math.random() * statuts.length)];
		const dateDebut = new Date();
		dateDebut.setFullYear(2025 + Math.floor(Math.random() * 1)); // 2025
		dateDebut.setMonth(Math.floor(Math.random() * 12));
		dateDebut.setDate(Math.floor(Math.random() * 28) + 1);

		const dateFin = new Date(dateDebut);
		dateFin.setDate(dateDebut.getDate() + Math.floor(Math.random() * 28) + 1); // Congé de 1 à 15 jours

		const congesData = {
			agentId: agent.id,
			dateDebut,
			dateFin,
			statut,
			TypeConges: typesConges[Math.floor(Math.random() * typesConges.length)],
			commentaire: `Demande de congé pour ${agent.prenom} ${agent.nom}`,
			approuvePar: statut !== "en attente" ? approver.id : undefined,
			remplacantId: statut === "approuve" ? replacer.id : undefined,
			dateDecision: statut !== "en attente" ? new Date() : undefined,
			commentaireDecision:
				statut !== "en attente" ? `Décision pour la demande de ${agent.prenom}` : undefined,
		};

		await Conges.create(congesData as any);
		createdCount++;
	}

	console.log(`✅ ${createdCount} demandes de congé créées.`);
}

async function seedPrets() {
	console.log(`\n=== Création des données de prêts et retenues ===`);

	const agents = await Agent.findAll();
	if (agents.length === 0) {
		console.log("⚠️  Aucun agent trouvé, impossible de créer des prêts.");
		return;
	}

	const statuses: ("en_attente" | "approuve" | "rejete" | "en_cours" | "termine")[] = [
		"en_attente",
		"approuve",
		"rejete",
		"en_cours",
		"termine",
	];
	const motifs = [
		"Achat véhicule",
		"Rénovation maison",
		"Frais de scolarité",
		"Urgence médicale",
		"Projet personnel",
	];

	let createdCount = 0;

	// Créer 40 demandes de prêt pour des agents aléatoires
	for (let i = 0; i < 40; i++) {
		const agent = agents[Math.floor(Math.random() * agents.length)];
		const status = statuses[Math.floor(Math.random() * statuses.length)];
		const montant = Math.floor(Math.random() * (5000 - 500 + 1)) + 500;
		const dureeRemboursement = Math.floor(Math.random() * (24 - 6 + 1) + 6); // Durée entre 6 et 24 mois
		const tauxInteret = Math.random() * (5 - 1) + 1; // Taux entre 1% et 5%

		const dateDemande = new Date();
		dateDemande.setFullYear(2025 + Math.floor(Math.random() * 1)); // 2023 ou 2024
		dateDemande.setMonth(Math.floor(Math.random() * 12));

		const pretData: any = {
			agentId: agent.id,
			montant,
			dateDemande,
			dureeRemboursement,
			tauxInteret,
			motif: motifs[Math.floor(Math.random() * motifs.length)],
			status,
		};

		if (status !== "en_attente" && status !== "rejete") {
			pretData.dateAccord = new Date(dateDemande.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 jours après
			const montantTotal = montant * (1 + tauxInteret / 100);
			pretData.montantMensuel = montantTotal / dureeRemboursement;

			if (status === "en_cours") {
				pretData.remboursementsEffectues = Math.floor(Math.random() * (dureeRemboursement - 1));
				pretData.soldeRestant =
					montantTotal - pretData.montantMensuel * pretData.remboursementsEffectues;
			} else if (status === "termine") {
				pretData.remboursementsEffectues = dureeRemboursement;
				pretData.soldeRestant = 0;
			}
		}

		await PretRetenu.create(pretData);
		createdCount++;
	}

	console.log(`✅ ${createdCount} demandes de prêt créées.`);
}

async function seedEvaluations() {
	console.log(`\n=== Création des données d'évaluations ===`);

	const agents = await Agent.findAll();
	if (agents.length < 2) {
		console.log("⚠️  Pas assez d'agents trouvés, impossible de créer des évaluations.");
		return;
	}

	const periodes = ["2023-Semestre 1", "2023-Semestre 2", "2024-Semestre 1"];
	let createdCount = 0;

	// Créer 150 évaluations
	for (let i = 0; i < 150; i++) {
		const agent = agents[Math.floor(Math.random() * agents.length)];
		let evaluateur = agents[Math.floor(Math.random() * agents.length)];

		// S'assurer que l'évaluateur n'est pas l'agent lui-même
		while (evaluateur.id === agent.id) {
			evaluateur = agents[Math.floor(Math.random() * agents.length)];
		}

		const discipline = Math.floor(Math.random() * 16) + 5; // Score entre 5 et 20
		const savoirEtre = Math.floor(Math.random() * 16) + 5;
		const collaboration = Math.floor(Math.random() * 16) + 5;
		const leadership = Math.floor(Math.random() * 16) + 5;
		const rigueur = Math.floor(Math.random() * 16) + 5;

		const scoreGlobal = discipline + savoirEtre + collaboration + leadership + rigueur;

		const evaluationData = {
			agent: agent.id,
			periode: periodes[Math.floor(Math.random() * periodes.length)],
			evaluateur: evaluateur.id,
			discipline,
			savoirEtre,
			collaboration,
			leadership,
			rigueur,
			observations: `Observations pour l'évaluation de ${agent.prenom} ${agent.nom}.`,
			objectifs: `Objectifs pour la prochaine période.`,
			scoreGlobal,
		};

		await Evaluation.create(evaluationData as any);
		createdCount++;
	}

	console.log(`✅ ${createdCount} évaluations créées.`);
}

async function seedDiscipline() {
	console.log(`\n=== Création des données de discipline ===`);

	const agents = await Agent.findAll();
	if (agents.length === 0) {
		console.log("⚠️  Aucun agent trouvé, impossible de créer des cas de discipline.");
		return;
	}

	const typesFaute: any[] = [
		"Retards (08h00-09h00)",
		"Absences (après 09h00)",
		"Sorties non autorisées",
		"Absences au poste",
		"Mauvais usage de documents administratifs",
		"Visites sans rapport avec le service",
		"Agents de catégories C et D visités",
		"Visites préjudiciables pour l’UNIGOM",
		"Usage personnel du téléphone/réseaux sociaux pendant le service",
		"Refus d'exécuter les ordres du chef hiérarchique",
		"Refus d'exécuter les ordres dans le délai imparti avec raison valable",
		"Préjudices dus au refus d'exécuter les ordres",
		"Agents ne vérifiant pas l'exécution des ordres par leurs subordonnés",
		"Abandon de poste sans formalités",
		"Non-réponse à l'affectation dans le délai imparti sans raison valable",
		"Non-communication de faits compromettant le service",
		"Induction en erreur du chef hiérarchique ou collaborateur",
		"Comportement nuisant à l’ambiance de travail",
		"Voies de fait sur les chefs ou pairs",
		"Injures ou voies de fait par les chefs hiérarchiques",
		"Usage abusif des biens de l’UNIGOM",
		"Usage abusif des agents par le chef hiérarchique",
		"Destruction ou disparition de documents de l’UNIGOM",
		"Recrutement et alignement illégaux aux avantages",
		"Sollicitation de dons ou gratifications",
		"Acceptation d'argent pour actes réguliers",
		"Vol de biens ou documents de l’UNIGOM",
		"Actes de concussion",
		"Perceptions sans base légale",
		"Établissement de faux documents",
		"Fausses déclarations pour avantages illicites",
		"Participation à une décision avec conflit d'intérêts",
		"Non-récusation dans un dossier avec conflit d'intérêts",
		"Actes sans motivation administrative valable",
		"Actes motivés par discrimination ou favoritisme",
		"Acceptation de mandat dans des affaires privées",
		"Acceptation de mandat dans une entreprise privée",
		"Travaux non autorisés pour un tiers",
		"Activités scientifiques non autorisées pendant le service",
		"Exercice d'une activité commerciale",
		"Prêts d'argent à taux usurier sur le lieu de travail",
		"Atteinte à la moralité publique sur le lieu de travail",
		"Condamnation à une peine de servitude pénale",
		"Condamnation pour corruption ou détournement",
		"Indiscrétion sur des faits confidentiels",
		"Fuite d'information préjudiciable",
		"Indiscrétion sur un secret d'État",
		"Interview ou déclaration non autorisée",
		"Atteinte à la sécurité de l'État",
		"Adhésion à un parti politique ou groupe nuisible",
		"Port d'armes contre le pays",
		"Facilitation de l'entrée d'ennemis sur le territoire",
		"Intelligence avec une puissance ennemie",
		"Refus de participer à une cérémonie officielle",
		"Agents en mission d'inspection ouvrant une action disciplinaire",
		"Octroi d'avantages illicites par manœuvres frauduleuses",
		"Dégradation de biens de l'État sans intention de nuire",
		"Dégradation de biens de l'État avec intention de nuire",
		"Perception indue de sommes ou avantages par des agents",
	];
	const gravites: ("Légère" | "Moyenne" | "Grave" | "Très grave")[] = [
		"Légère",
		"Moyenne",
		"Grave",
		"Très grave",
	];
	const sanctions: (
		| "Blâme"
		| "Mise à pied - 3 jours"
		| "Retenue sur salaire"
		| "Dégradation"
		| "Révocation"
	)[] = ["Blâme", "Mise à pied - 3 jours", "Retenue sur salaire", "Dégradation", "Révocation"];
	const statuts: ("En attente" | "Validé" | "Rejeté")[] = ["En attente", "Validé", "Rejeté"];

	let createdCount = 0;

	// Créer 30 cas de discipline
	for (let i = 0; i < 30; i++) {
		const agent = agents[Math.floor(Math.random() * agents.length)];
		const dateIncident = new Date();
		dateIncident.setFullYear(2025 + Math.floor(Math.random() * 1)); // 2023 ou 2024
		dateIncident.setMonth(Math.floor(Math.random() * 12));
		dateIncident.setDate(Math.floor(Math.random() * 28) + 1);

		const disciplineData = {
			agentId: agent.id,
			typeFaute: typesFaute[Math.floor(Math.random() * typesFaute.length)],
			gravite: gravites[Math.floor(Math.random() * gravites.length)],
			sanctionProposee: sanctions[Math.floor(Math.random() * sanctions.length)],
			dateIncident,
			description: `Description de l'incident pour ${agent.prenom} ${agent.nom}.`,
			justification: `Justification fournie par l'agent.`,
			statut: statuts[Math.floor(Math.random() * statuts.length)],
		};

		await Discipline.create(disciplineData as any);
		createdCount++;
	}

	console.log(`✅ ${createdCount} cas de discipline créés.`);
}

async function seedPromotions() {
	console.log(`\n=== Création des données de promotions ===`);

	const agents = await Agent.findAll();
	const grades = await GradeAgent.findAll();
	const typesPromotion = await CategorieAgent.findAll();

	if (agents.length > 0 && grades.length > 1 && typesPromotion.length > 0) {
		for (let i = 0; i < 10; i++) {
			const agent = agents[i % agents.length];
			const currentGradeIndex = i % grades.length;
			const proposedGradeIndex = (i + 1) % grades.length;

			await Promotion.create({
				agentId: agent.id,
				currentGradeId: grades[currentGradeIndex].id,
				proposedGradeId: grades[proposedGradeIndex].id,
				typePromotionId: typesPromotion[i % typesPromotion.length].id,
				motif: `Promotion pour l'agent ${agent.nom} pour son excellent travail.`,
				statut: "soumise",
				dateProposition: new Date(),
			});
		}
		console.log("✅ 10 promotions créées.");
	} else {
		console.log("🟡 Pas assez de données pour créer les promotions.");
	}
}

async function seedTrainings() {
	console.log(`\n=== Création des données de formations ===`);

	const agents = await Agent.findAll();
	if (agents.length === 0) {
		console.log("⚠️  Aucun agent trouvé, impossible de créer des formations.");
		return;
	}

	const typesFormation: ("Initiale" | "Continue" | "Recyclage")[] = [
		"Initiale",
		"Continue",
		"Recyclage",
	];
	const domaines: string[] = [
		"Informatique",
		"Gestion de projet",
		"Communication",
		"Droit du travail",
		"Sécurité",
		"Langues",
	];

	const formationsParDomaine: { [key: string]: string[] } = {
		Informatique: [
			"Développement Web Avancé",
			"Sécurité des Réseaux",
			"Administration de Bases de Données",
		],
		"Gestion de projet": ["Méthodologies Agiles", "Gestion des Risques", "Certification PMP"],
		Communication: ["Prise de Parole en Public", "Communication Interpersonnelle"],
		"Droit du travail": ["Négociation Collective", "Gestion des Conflits"],
		Sécurité: ["Prévention Incendie", "Premiers Secours"],
		Langues: ["Anglais des Affaires", "Swahili Professionnel"],
	};

	let createdCount = 0;

	// Créer 80 formations
	for (let i = 0; i < 80; i++) {
		const agent = agents[Math.floor(Math.random() * agents.length)];
		const domaine = domaines[Math.floor(Math.random() * domaines.length)];
		const titreFormation =
			formationsParDomaine[domaine][
				Math.floor(Math.random() * formationsParDomaine[domaine].length)
			];

		const dateDebut = new Date();
		dateDebut.setFullYear(2025 + Math.floor(Math.random() * 1));
		dateDebut.setMonth(Math.floor(Math.random() * 12));
		dateDebut.setDate(Math.floor(Math.random() * 28) + 1);

		const duree = Math.floor(Math.random() * 10) + 2; // de 2 à 11 jours
		const dateFin = new Date(dateDebut);
		dateFin.setDate(dateDebut.getDate() + duree);

		const trainingData = {
			agentId: agent.id,
			titre: titreFormation,
			typeFormation: typesFormation[Math.floor(Math.random() * typesFormation.length)],
			domaine: domaine,
			organisme: "Orasys",
			dateDebut,
			dateFin,
			duree,
			certificationObtenue: Math.random() > 0.5,
		};

		await Training.create(trainingData as any);
		createdCount++;
	}

	console.log(`✅ ${createdCount} formations créées.`);
}

async function seedRemunerations() {
	console.log(`\n=== Création des rémunérations ===`);
	try {
		const agents = await Agent.findAll();
		if (agents.length === 0) {
			console.log("Aucun agent trouvé, impossible de créer les rémunérations.");
			return;
		}

		const remunerationsData: RemunerationCreationAttributes[] = [];
		const periods = Array.from({ length: 3 }, (_, i) => {
			const d = new Date();
			d.setMonth(d.getMonth() - i);
			return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
		});
		const contractTypes: RemunerationCreationAttributes["typeContrat"][] = [
			"CDI",
			"CDD",
			"Vacataire",
		];
		const paymentMethods: RemunerationCreationAttributes["modePaiement"][] = [
			"Banque",
			"Espèces",
			"Mobile Money",
		];

		for (const agent of agents) {
			for (const periode of periods) {
				const salaireBase = Math.floor(Math.random() * (3000 - 500 + 1)) + 500;
				const primeInstitutionnelle = Math.floor(Math.random() * 200);
				const indemniteTransport = Math.floor(Math.random() * 100);
				const cotisationSociale = salaireBase * 0.05;
				const impotProfessionnel = salaireBase * 0.15;

				const salaireBrut = salaireBase + primeInstitutionnelle + indemniteTransport;
				const totalRetenues = cotisationSociale + impotProfessionnel;
				const salaireNet = salaireBrut - totalRetenues;

				remunerationsData.push({
					agentId: agent.id,
					periode,
					salaireBase,
					joursTravailes: 22,
					primeInstitutionnelle,
					indemniteTransport,
					cotisationSociale,
					impotProfessionnel,
					salaireBrut,
					totalRetenues,
					salaireNet,
					typeContrat: contractTypes[Math.floor(Math.random() * contractTypes.length)],
					modePaiement: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
					valide: true,
					commentaire: `Fiche de paie pour ${periode}`,
				});
			}
		}

		await Remuneration.bulkCreate(remunerationsData);
		console.log(`✅ ${remunerationsData.length} fiches de rémunération créées.`);
	} catch (error) {
		console.error("Erreur lors de la création des rémunérations:", error);
	}
}

async function seedRetraites() {
	console.log(`\n=== Création des dossiers de retraite ===`);
	try {
		const allAgents = await Agent.findAll();
		// Filter for agents born before 1970 to make data more realistic
		const eligibleAgents = allAgents.filter(
			(agent) => new Date(agent.dateNaissance).getFullYear() < 1970,
		);

		if (eligibleAgents.length === 0) {
			console.log("Aucun agent éligible à la retraite trouvé, seeder ignoré.");
			return;
		}

		const retraitesData: RetraiteCreationAttributes[] = [];
		const retraiteTypes: RetraiteCreationAttributes["typeRetraite"][] = [
			"limite_age",
			"anticipee",
			"invalidite",
			"volontaire",
		];

		for (const agent of eligibleAgents) {
			const dateRetraite = new Date();
			dateRetraite.setFullYear(dateRetraite.getFullYear() + Math.floor(Math.random() * 5));

			const salaireActuel = Math.floor(Math.random() * (4000 - 1500 + 1)) + 1500;
			const anciennete = new Date().getFullYear() - new Date(agent.dateEmbauche).getFullYear();

			retraitesData.push({
				agentId: agent.id,
				typeRetraite: retraiteTypes[Math.floor(Math.random() * retraiteTypes.length)],
				dateRetraite,
				anciennete,
				salaireActuel,
				pensionEstimee: salaireActuel * 0.6,
				cotisationsTotales: anciennete * salaireActuel * 0.1 * 12,
				motifRetraite: "Départ programmé.",
			});
		}

		await Retraite.bulkCreate(retraitesData);
		console.log(`✅ ${retraitesData.length} dossiers de retraite créés.`);
	} catch (error) {
		console.error("Erreur lors de la création des dossiers de retraite:", error);
	}
}

async function seedRecrutements() {
	console.log(`\n=== Création des demandes de recrutement ===`);
	try {
		const agents = await Agent.findAll();
		if (agents.length === 0) {
			console.log("Aucun agent trouvé, impossible de créer des recrutements.");
			return;
		}

		const recrutementsData: RecrutementCreationAttributes[] = [];
		const postes: RecrutementAttributes["posteDemande"][] = [
			"Ressources Humaines",
			"Informatique",
			"Finances",
			"Bibliothèque",
		];
		const grades: RecrutementAttributes["gradeSouhaite"][] = [
			"Assistant",
			"Chef de Travaux",
			"Agent Administratif Niveau 1",
			"Technicien",
		];
		const etats: RecrutementAttributes["etat"][] = ["en_attente", "approuvee", "rejettee"];

		for (let i = 0; i < 15; i++) {
			const etat = etats[i % etats.length];
			const creeParAgent = agents[i % agents.length];
			let valideParAgent: Agent | null = null;
			let dateValidation: Date | null = null;

			if (etat === "approuvee") {
				valideParAgent = agents[(i + 1) % agents.length]; // Different agent for validation
				dateValidation = new Date();
			}

			recrutementsData.push({
				nom: `NomCandidat${i}`,
				postnom: `Postnom${i}`,
				prenom: `Prenom${i}`,
				posteDemande: postes[i % postes.length],
				direction: postes[i % postes.length],
				gradeSouhaite: grades[i % grades.length],
				motif: `Besoin de personnel pour le département ${postes[i % postes.length]}.`,
				etat,
				documents: [
					{ nom: "CV.pdf", lien: "/docs/cv.pdf", type: "application/pdf", taille: 123456 },
					{
						nom: "Lettre.docx",
						lien: "/docs/lettre.docx",
						type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
						taille: 78910,
					},
				],
				creePar: creeParAgent.id,
				validePar: valideParAgent ? valideParAgent.id : null,
				dateValidation,
				sexe: "M",
				dateNaissance: new Date(),
			});
		}

		await Recrutement.bulkCreate(recrutementsData);
		console.log(`✅ ${recrutementsData.length} demandes de recrutement créées.`);
	} catch (error) {
		console.error("Erreur lors de la création des recrutements:", error);
	}
}

async function seedDocumentsRessourceHumaine() {
	console.log(`\n=== Création des documents des ressources humaines ===`);
	try {
		const agents = await Agent.findAll();
		if (agents.length === 0) {
			console.log("Aucun agent trouvé, impossible de créer des documents.");
			return;
		}

		const documentsData: DocumentRessourceHumaineCreationAttributes[] = [
			{
				agentId: 1,
				titre: "Exemple de document RH",
				typeDocument: "CV actualisés numérisés",
				confidentialite: "public",
				fichier: [
					{
						nom: "cv_john_doe",
						lien: "/uploads/rh/cv_john_doe.pdf",
						type: "application/pdf",
						taille: 123456,
					},
				],
			},
			// ... autres documents ...
		];
		const docTypes: DocumentRessourceHumaineAttributes["typeDocument"][] = [
			"Photos passeport numérisées",
			"CV actualisés numérisés",
			"Cartes d’identité numérisées",
			"Cartes de service/ Passeport à jour  numérisés",
			"Décisions de recrutement numérisées",
			"Décisions de promotion numérisées",
			"listes des dépendants  numérisés",
			"Diplômes numérisés",
			"pages de Titre de la thèse  de doctorat numérisées",
			"Décisions d’attribution du numéro matricule numérisés",
			"certificat de nationalité numérisés",
			"Attestations de naissance numérisées",
			"Attestations d’aptitude physique numérisées",
			"Attestations de résidence numérisées",
			"Charges horaires des enseignants numérisés",
			"Prix obtenus numérisés",
			"Job description des administratifs numérisés",
		];

		for (const agent of agents) {
			for (let i = 0; i < 2; i++) {
				// Create 2 documents per agent
				const typeDocument = docTypes[Math.floor(Math.random() * docTypes.length)];
				documentsData.push({
					agentId: agent.id,
					titre: `${typeDocument} de ${agent.nom}`,
					typeDocument,
					emetteur: "Université de Goma",
					confidentialite: "confidentiel",
					fichier: [
						{
							nom: `${typeDocument.toLowerCase().replace(/\s/g, "_")}_${agent.id}.pdf`,
							lien: `/uploads/documents/${typeDocument.toLowerCase().replace(/\s/g, "_")}_${agent.id}.pdf`,
							type: "application/pdf",
							taille: Math.floor(Math.random() * 500000) + 100000,
						},
					],
				});
			}
		}

		await DocumentRessourceHumaine.bulkCreate(documentsData);
		console.log(`✅ ${documentsData.length} documents créés.`);
	} catch (error) {
		console.error("Erreur lors de la création des documents:", error);
	}
}

async function seedSocialSupports() {
	console.log(`\n=== Création des demandes d'aide sociale ===`);
	try {
		const agents = await Agent.findAll();
		if (agents.length === 0) {
			console.log("Aucun agent trouvé, impossible de créer des aides sociales.");
			return;
		}

		const socialSupportsData: SocialSupportCreationAttributes[] = [];
		const supportTypes: SocialSupportAttributes["type"][] = [
			"Cas de maladie",
			"Cas de maternité",
			"Cas d’invalidité",
			"Cas de décès",
			"Cas d’accidents au travail",
			"Cas de maladie professionnelle",
			"Veuves",
			"Veufs",
			"Autres",
		];
		const statuses: SocialSupportAttributes["statut"][] = ["En attente", "Approuvée", "Rejetée"];

		// Create social support for a subset of agents
		for (let i = 0; i < agents.length / 2; i++) {
			const agent = agents[i];
			const type = supportTypes[Math.floor(Math.random() * supportTypes.length)];
			const statut = statuses[Math.floor(Math.random() * statuses.length)];

			socialSupportsData.push({
				agentId: agent.id,
				type,
				description: `Demande d'${type.toLowerCase()} pour ${agent.prenom} ${agent.nom}`,
				montant: Math.floor(Math.random() * 50000) + 10000,
				dateDemande: new Date(),
				statut,
			});
		}

		await SocialSupport.bulkCreate(socialSupportsData);
		console.log(`✅ ${socialSupportsData.length} demandes d'aide sociale créées.`);
	} catch (error) {
		console.error("Erreur lors de la création des aides sociales:", error);
	}
}

async function seedReclammations() {
	console.log(`\n=== Création des réclamations ===`);
	try {
		const agents = await Agent.findAll();
		if (agents.length < 2) {
			console.log("Pas assez d'agents pour créer des réclamations (min 2).");
			return;
		}

		const reclammationsData: ReclammationCreationAttributes[] = [];
		const motifs = ["Harcèlement", "Conflit interpersonnel", "Conditions de travail", "Salaire"];
		const priorites = ["Basse", "Moyenne", "Haute"];

		for (let i = 0; i < 10; i++) {
			const agentPlaignant = agents[Math.floor(Math.random() * agents.length)];
			let agentResponsable = agents[Math.floor(Math.random() * agents.length)];

			// Ensure the responsible agent is not the same as the complaining agent
			while (agentResponsable.id === agentPlaignant.id) {
				agentResponsable = agents[Math.floor(Math.random() * agents.length)];
			}

			reclammationsData.push({
				agentId: agentPlaignant.id,
				responsable: agentResponsable.id,
				motifReclamation: motifs[Math.floor(Math.random() * motifs.length)],
				priorite: priorites[Math.floor(Math.random() * priorites.length)],
				dateIncident: new Date().toISOString().split("T")[0],
				temoin: "Aucun",
				sujetReclamation: `Réclamation concernant ${motifs[Math.floor(Math.random() * motifs.length)].toLowerCase()}`,
				descriptionReclamation: "Description détaillée de l'incident...",
				solutionSouhaitee: "Une médiation et une résolution rapide.",
				justificatif: "",
				resolu: Math.random() > 0.5,
				createdAt: new Date(),
			});
		}

		await Reclammation.bulkCreate(reclammationsData);
		console.log(`✅ ${reclammationsData.length} réclamations créées.`);
	} catch (error) {
		console.error("Erreur lors de la création des réclamations:", error);
	}
}

async function seedAuditLogs() {
	// TODO: Implement audit log seeding
}

async function seedDirectionAgents() {
	console.log(`\n=== Création des directions ===`);
	try {
		const directions = [
			{ nom: "Ressources Humaines" as const },
			{ nom: "Patrimoine" as const },
			{ nom: "Œuvres Estudiantines" as const },
		];

		for (const dir of directions) {
			await DirectionAgent.findOrCreate({
				where: { nom: dir.nom },
				defaults: dir,
			});
		}

		console.log("✅ Directions créées/vérifiées.");
	} catch (error) {
		console.error("❌ Erreur lors de la création des directions:", error);
	}
}

async function seedAgentDirections() {
	console.log(`\n=== Association des agents aux directions ===`);
	try {
		const agents = await Agent.findAll({ limit: 5 });
		const directions = await DirectionAgent.findAll();

		if (agents.length === 0 || directions.length === 0) {
			console.log("⚠️  Agents ou directions non trouvés, association impossible.");
			return;
		}

		for (let i = 0; i < agents.length; i++) {
			const agent = agents[i];
			const direction = directions[i % directions.length];
			await agent.addDirection(direction);
		}

		console.log("✅ Agents associés aux directions.");
	} catch (error) {
		console.error("❌ Erreur lors de l'association des agents aux directions:", error);
	}
}

async function seedTaskForecasts() {
	console.log(`\n=== Création des prévisions de tâches ===`);
	try {
		const agents = await Agent.findAll({ limit: 5 });
		const adminAgent = await Agent.findOne({ where: { matricule: "A0001" } });

		if (agents.length === 0 || !adminAgent) {
			console.log("⚠️  Aucun agent trouvé, impossible de créer les prévisions de tâches.");
			return;
		}

		const taskForecastsData = [
			{
				agentId: agents[0].id,
				assignerId: adminAgent.id,
				titre: "Préparer le rapport annuel des RH",
				description:
					"Compiler toutes les données sur les recrutements, les départs et les promotions de l'année.",
				dateDebut: new Date("2025-08-01"),
				dateFin: new Date("2025-08-15"),
				priorite: "Haute" as const,
				statut: "Prévue" as const,
			},
			{
				agentId: agents[1].id,
				assignerId: adminAgent.id,
				titre: "Organiser la formation sur le nouveau logiciel",
				description:
					"Planifier les sessions de formation, préparer le matériel et envoyer les invitations.",
				dateDebut: new Date("2025-09-01"),
				dateFin: new Date("2025-09-30"),
				priorite: "Moyenne" as const,
				statut: "Prévue" as const,
			},
			{
				agentId: agents[0].id,
				assignerId: adminAgent.id,
				titre: "Mettre à jour les dossiers des employés",
				description:
					"Vérifier et compléter les informations manquantes dans les dossiers de tous les employés.",
				dateDebut: new Date("2025-07-25"),
				dateFin: new Date("2025-08-10"),
				priorite: "Moyenne" as const,
				statut: "En cours" as const,
			},
		];

		for (const data of taskForecastsData) {
			await TaskForecast.findOrCreate({
				where: { titre: data.titre, agentId: data.agentId },
				defaults: data,
			});
		}

		console.log("✅ Prévisions de tâches créées/vérifiées.");
	} catch (error) {
		console.error("❌ Erreur lors de la création des prévisions de tâches:", error);
	}
}

async function seedPersonnelMovements() {
	console.log(`\n=== Création des mouvements de personnel ===`);

	const agents = await Agent.findAll();
	const postes = await PosteAgent.findAll();

	if (agents.length === 0 || postes.length === 0) {
		console.log("⚠️  Agents ou Postes non trouvés, impossible de créer des mouvements.");
		return;
	}

	const typesMouvement: (
		| "Activite de service"
		| "Detachement"
		| "Disponibilite(interuption)"
		| "Suspension"
		| "Transfert"
		| "Changement de cadre organique"
	)[] = [
		"Activite de service",
		"Detachement",
		"Disponibilite(interuption)",
		"Suspension",
		"Transfert",
		"Changement de cadre organique",
	];

	let createdCount = 0;

	// Créer 40 mouvements de personnel
	for (let i = 0; i < 40; i++) {
		const agent = agents[Math.floor(Math.random() * agents.length)];
		const typeMouvement = typesMouvement[Math.floor(Math.random() * typesMouvement.length)];

		const ancienPoste = postes.find((p) => p.id === agent.posteId);

		const mouvementData = {
			agentId: agent.id,
			typeMouvement,
			ancienPoste: ancienPoste ? ancienPoste.nom : "N/A",
			nouveauPoste: postes[Math.floor(Math.random() * postes.length)].nom,
			dateMouvement: new Date(
				2023,
				Math.floor(Math.random() * 12),
				Math.floor(Math.random() * 28) + 1,
			),
			motif: `Mouvement de type '${typeMouvement}' pour l'agent ${agent.nom}`,
			statut: "valide" as const,
		};

		await PersonnelMovement.create(mouvementData);
		createdCount++;
	}

	console.log(`✅ ${createdCount} mouvements de personnel créés.`);
}

async function seed() {
	try {
		await connectToDatabase();

		console.log("\n=== Création des rôles ===");
		const roles = [
			{ name: "Administrateur Système", description: "Accès total à toutes les fonctionnalités" },
			{ name: "Recteur", description: "Responsable principal de l'université" },
			{ name: "SGAD", description: "Secrétaire Général Administratif" },
			{ name: "Secreatire du SGAD", description: "Secrétaire du SGAD" },
			{ name: "Assistant SGAD", description: "Assistant du Secrétaire Général Administratif" },
			{ name: "DRH", description: "Directeur des Ressources Humaines" },
			{ name: "Assistant du DRH", description: "Assistant du Directeur des Ressources Humaines" },
			{ name: "Agent des Ressources Humaines", description: "Agent des Ressources Humaines" },
			{ name: "Directeur Patrimoine", description: "Directeur du Patrimoine" },
			{ name: "Assistant du Dir. Patrimoine", description: "Assistant du Directeur du Patrimoine" },
			{ name: "Agent du Patrimoine", description: "Agent du Patrimoine" },
			{ name: "DIROE", description: "Directeur des Œuvres Estudiantines" },
			{ name: "Assistant DIROE", description: "Assistant du Directeur des Œuvres Estudiantines" },
			{
				name: "Dir. Numérisation et Archivage",
				description: "Directeur de la Numérisation et Archivage",
			},
			{
				name: "Dir. des Mutuelles et Assurances",
				description: "Directeur des Mutuelles et Assurances",
			},
			{ name: "Agent Mutuelles et Assurances", description: "Agent des Mutuelles et Assurances" },
			{
				name: "Agent Numérisation et Archivage",
				description: "Agent de la Numérisation et Archivage",
			},
			{ name: "Agent", description: "Agent administratif ou technique : Utilisateur Standard" },
		];

		for (const role of roles) {
			await Role.findOrCreate({ where: { name: role.name }, defaults: role });
		}
		console.log("✅ Rôles créés/vérifiés.");

		// Charger tous les rôles pour les affectations ultérieures
		const allRoles = await Role.findAll();

		console.log("\n=== Création des modules et composants ===");
		for (const section of sidebarItems) {
			const [module] = await Module.findOrCreate({
				where: { name: section.title },
				defaults: {
					name: section.title,
					slug: slugify(section.title),
					description: `Module pour ${section.title}`,
					iconName: section.items[0]?.icon || "Grid3X3", // Use first item's icon or a default
					isActive: true,
				},
			});

			for (const [index, item] of section.items.entries()) {
				await Component.findOrCreate({
					where: { name: item.name, moduleId: module.id },
					defaults: {
						name: item.name,
						path: item.href,
						moduleId: module.id,
						iconName: item.icon,
						order: index,
						description: `Composant ${item.name}`,
					},
				});
			}
		}
		console.log("✅ Modules et composants créés/vérifiés.");

		await seedAffectations();
		await seedCategories();
		await seedGrades();
		await seedPostes();

		console.log("\n=== Création de l'agent et de l'utilisateur admin ===");
		const firstPoste = await PosteAgent.findOne();
		const firstGrade = await GradeAgent.findOne();
		const firstCategorie = await CategorieAgent.findOne();
		const firstAffectation = await Affectation.findOne();

		if (!firstPoste || !firstGrade || !firstCategorie || !firstAffectation) {
			console.error(
				"Erreur: Impossible de trouver les données de base (poste, grade, catégorie, affectation) pour créer l'admin.",
			);
			return;
		}

		const adminAgentData = {
			matricule: "A0001",
			nom: "Admin",
			postnom: "Sys",
			prenom: "Admin",
			sexe: "M" as const,
			dateNaissance: new Date("1990-01-01"),
			lieuNaissance: "Kinshasa",
			nationalite: "Congolaise",
			provinceOrigine: "Kinshasa",
			villeResidence: "Kinshasa",
			adresseComplete: "1, Av. de l'Université, Lemba, Kinshasa",
			telephone: "810000000",
			email: "admin@unigom.cd",
			etatCivil: "célibataire" as const,
			statut: "actif" as const,
			posteId: firstPoste.id,
			gradeId: firstGrade.id,
			categorieId: firstCategorie.id,
			affectationId: firstAffectation.id,
			situationAdministrative: "permanent" as const,
			typeAgent: "temps plein" as const,
			photo: "https://i.pravatar.cc/150?u=a042581f4e29026024d",
			nombreEnfants: 0,
			nombrePersonnesACharge: 0,
			dateEmbauche: new Date("2020-01-01"),
			numCnas: "CNAS0001",
		};

		let adminAgent = await Agent.findOne({ where: { matricule: adminAgentData.matricule } });
		if (!adminAgent) {
			adminAgent = await Agent.create(adminAgentData);
			console.log("✅ Agent admin créé");
		} else {
			console.log("⏭️  Agent admin déjà existant");
		}

		const adminRole = await Role.findOne({ where: { name: "Administrateur Système" } });
		if (adminRole) {
			const adminUserData = {
				agentId: adminAgent.id,
				password: "$2b$10$r.GCSc5yfAv.IOSUo0CjX./y6mVbv13Ybl3I5XKgh0mfgfKY3BKVm", // Le mot de passe sera hashé par le hook
				roleId: adminRole.id,
				isActive: true,
				email: "admin@unigom.cd",
			};
			let user = await User.findOne({ where: { email: adminUserData.email } });
			if (!user) {
				user = await User.create(adminUserData);
				console.log("✅ Utilisateur admin créé");
			} else {
				console.log("⏭️  Utilisateur admin déjà existant");
			}
		} else {
			console.log(
				"⚠️  Rôle 'Administrateur Système' non trouvé. Impossible de créer l'utilisateur admin.",
			);
		}

		console.log("\n=== Création des agents et utilisateurs supplémentaires ===");
		const agentsToCreate = [
			{ nom: "Lutete", prenom: "Jean", postnom: "Mukendi", email: "charlotte.mwila@unigom.cd" },
			{ nom: "Tshibangu", prenom: "Alice", postnom: "Mwila", email: "benita.kasongo@unigom.cd" },
			{ nom: "Bope", prenom: "Jade", postnom: "Mukendi", email: "cédric.mwila@unigom.cd" },
			{ nom: "Kabwika", prenom: "Cédric", postnom: "Mwila", email: "raphaël.lumbu@unigom.cd" },
			{ nom: "Kabeya", prenom: "Inès", postnom: "Bope", email: "emma.mpoyi@unigom.cd" },
			{ nom: "Kabamba", prenom: "Manon", postnom: "Lumbu", email: "raphaël.kabamba@unigom.cd" },
			{ nom: "Ilunga", prenom: "Cécile", postnom: "Mwila", email: "chloé.kasongo@unigom.cd" },
			{ nom: "Kasongo", prenom: "Manon", postnom: "Tshiala", email: "manon.kabwita@unigom.cd" },
			{ nom: "Mwila", prenom: "Paul", postnom: "Bope", email: "gabriel.ilunga@unigom.cd" },
			{ nom: "Mwamba", prenom: "Théo", postnom: "Mukendi", email: "louis.kabwika@unigom.cd" },
			{ nom: "Kabamba", prenom: "Luc", postnom: "Mpoyi", email: "grace.kabwika@unigom.cd" },
			{ nom: "Kabamba", prenom: "Grace", postnom: "Kanku", email: "luc.ntumba@unigom.cd" },
			{ nom: "Mwila", prenom: "Exauce", postnom: "Mbu", email: "julie.kabamba@unigom.cd" },
			{ nom: "Mwila", prenom: "Gabriel", postnom: "Kabwita", email: "benita.mwila@unigom.cd" },
			{ nom: "Mukendi", prenom: "Exauce", postnom: "Kabeya", email: "jade.mwila@unigom.cd" },
			{ nom: "Kabwika", prenom: "Jean", postnom: "Kabwita", email: "jean.mwila@unigom.cd" },
			{ nom: "Mpoyi", prenom: "Lucas", postnom: "Kabwita", email: "thomas.kabwika@unigom.cd" },
			{ nom: "Mukendi", prenom: "Charlotte", postnom: "Kabamba", email: "lucas.mukendi@unigom.cd" },
			{ nom: "Mukendi", prenom: "Juliette", postnom: "Kasongo", email: "léonie.kabamba@unigom.cd" },
			{ nom: "Kabamba", prenom: "Chris", postnom: "Ilunga", email: "julie.kankolongo@unigom.cd" },
			{ nom: "Mwila", prenom: "Camille", postnom: "Kabwita", email: "camille.kabwita1@unigom.cd" },
			{ nom: "Mwila", prenom: "Nathan", postnom: "Kabwita", email: "nathan.kabwita1@unigom.cd" },
			{ nom: "Mwila", prenom: "Antoine", postnom: "Kabwita", email: "antoine.kabwita1@unigom.cd" },
			{ nom: "Mwila", prenom: "Camille", postnom: "Kabwita", email: "camille.kabwita2@unigom.cd" },
			{ nom: "Mwila", prenom: "Nathan", postnom: "Kabamba", email: "nathan.mwila@unigom.cd" },
			{ nom: "Mukendi", prenom: "Chris", postnom: "Mpiana", email: "nicolas.kabwika@unigom.cd" },
			{ nom: "Mukendi", prenom: "Nathan", postnom: "Kabwika", email: "nathan.mukendi@unigom.cd" },
			{ nom: "Mukendi", prenom: "Thomas", postnom: "Mwamba", email: "felly.kabamba@unigom.cd" },
			{ nom: "Mukendi", prenom: "Antoine", postnom: "Mwila", email: "théo.kabeya@unigom.cd" },
			{ nom: "Tshiala", prenom: "Benita", postnom: "Mpoyi", email: "elise.kasongo@unigom.cd" },
			{ nom: "Kabeya", prenom: "Chloé", postnom: "Ntumba", email: "élodie.mpoyi@unigom.cd" },
			{ nom: "Kabeya", prenom: "Baptiste", postnom: "Lumbu", email: "camille.kabwika@unigom.cd" },
			{ nom: "Mukendi", prenom: "Élodie", postnom: "Kabeya", email: "thomas.mukendi@unigom.cd" },
			{ nom: "Mpoyi", prenom: "Pierre", postnom: "Kabwita", email: "ambre.kabamba@unigom.cd" },
			{ nom: "Kabeya", prenom: "Grace", postnom: "Kabwita", email: "grace.kabwita1@unigom.cd" },
			{ nom: "Kabwika", prenom: "Nathan", postnom: "Kabeya", email: "grace.mwila@unigom.cd" },
			{ nom: "Mwamba", prenom: "Sophie", postnom: "Mwila", email: "ambre.mukendi@unigom.cd" },
			{ nom: "Kabwita", prenom: "Anna", postnom: "Mwila", email: "elise.kabamba@unigom.cd" },
			{ nom: "Mukendi", prenom: "Enzo", postnom: "Mwila", email: "thomas.kabamba@unigom.cd" },
			{ nom: "Kasongo", prenom: "Théo", postnom: "Mpoyi", email: "simon.mpoyi@unigom.cd" },
			{ nom: "Kabamba", prenom: "Anna", postnom: "Kabwika", email: "julie.mpiana@unigom.cd" },
			{ nom: "Mwila", prenom: "Antoine", postnom: "Kabwita", email: "antoine.kabwita2@unigom.cd" },
			{ nom: "Mwila", prenom: "Camille", postnom: "Kabwita", email: "camille.kabwita3@unigom.cd" },
			{ nom: "Mwila", prenom: "Nathan", postnom: "Kabamba", email: "nathan.mwila6@unigom.cd" },
			{ nom: "Mukendi", prenom: "Chris", postnom: "Mpiana", email: "chris.mpiana@unigom.cd" },
			{ nom: "Mukendi", prenom: "Nathan", postnom: "Kabwika", email: "nathan.kabwika@unigom.cd" },
			{ nom: "Mukendi", prenom: "Thomas", postnom: "Mwamba", email: "thomas.mwamba@unigom.cd" },
			{ nom: "Mukendi", prenom: "Antoine", postnom: "Mwila", email: "antoine.mwila@unigom.cd" },
			{ nom: "Tshiala", prenom: "Benita", postnom: "Mpoyi", email: "benita.mpoyi@unigom.cd" },
			{ nom: "Kabeya", prenom: "Chloé", postnom: "Ntumba", email: "chloé.ntumba@unigom.cd" },
			{ nom: "Kabeya", prenom: "Baptiste", postnom: "Lumbu", email: "baptiste.lumbu@unigom.cd" },
			{ nom: "Mukendi", prenom: "Élodie", postnom: "Kabeya", email: "élodie.kabeya@unigom.cd" },
			{ nom: "Mpoyi", prenom: "Pierre", postnom: "Kabwita", email: "pierre.kabwita@unigom.cd" },
			{ nom: "Kabeya", prenom: "Grace", postnom: "Kabwita", email: "grace.kabwita2@unigom.cd" },
			{ nom: "Kabwika", prenom: "Nathan", postnom: "Kabeya", email: "nathan.kabeya@unigom.cd" },
			{ nom: "Mwamba", prenom: "Sophie", postnom: "Mwila", email: "sophie.mwila@unigom.cd" },
			{ nom: "Kabwita", prenom: "Anna", postnom: "Mwila", email: "anna.mwila@unigom.cd" },
			{ nom: "Mukendi", prenom: "Enzo", postnom: "Mwila", email: "enzo.mwila@unigom.cd" },
			{ nom: "Kasongo", prenom: "Théo", postnom: "Mpoyi", email: "théo.mpoyi@unigom.cd" },
		];

		const regularRole = await Role.findOne({ where: { name: "Agent" } });
		if (!regularRole) {
			console.log("⚠️  Rôle 'Agent' non trouvé. Impossible de créer les utilisateurs standards.");
		} else {
			const affectations = await Affectation.findAll();
			const categories = await CategorieAgent.findAll();
			const grades = await GradeAgent.findAll();
			const postes = await PosteAgent.findAll();

			if (
				affectations.length === 0 ||
				categories.length === 0 ||
				grades.length === 0 ||
				postes.length === 0
			) {
				console.log(
					"⚠️  Données de base (affectations, catégories, grades, postes) non trouvées. Impossible de créer les agents.",
				);
				return;
			}

			for (const [index, agentInfo] of agentsToCreate.entries()) {
				const matricule = `A${(index + 2).toString().padStart(4, "0")}`;

				let agent = await Agent.findOne({ where: { matricule: matricule } });
				if (!agent) {
					agent = await Agent.create({
						matricule: matricule,
						nom: agentInfo.nom,
						postnom: agentInfo.postnom,
						prenom: agentInfo.prenom,
						email: agentInfo.email,
						sexe: index % 2 === 0 ? "M" : "F",
						dateNaissance: new Date(`${1985 + index}-01-01`),
						lieuNaissance: `Lieu ${index + 2}`,
						nationalite: "Congolaise",
						provinceOrigine: "Kinshasa",
						villeResidence: "Kinshasa",
						adresseComplete: `${index + 2}, Av. Test, Kinshasa`,
						telephone: `8100000${(index + 2).toString().padStart(2, "0")}`,
						etatCivil: "célibataire" as const,
						statut: "actif" as const,
						posteId: postes[index % postes.length].id,
						gradeId: grades[index % grades.length].id,
						categorieId: categories[index % categories.length].id,
						affectationId: affectations[index % affectations.length].id,
						situationAdministrative: "permanent",
						typeAgent: "temps plein",
						photo: `https://i.pravatar.cc/150?u=a042581f4e2902670${index}`,
						dateEmbauche: new Date(`${2021 + index}-01-01`),
						numCnas: `CNAS${(index + 2).toString().padStart(4, "0")}`,
					});
					console.log(`✅ Agent ${agent.prenom} ${agent.nom} créé.`);
				} else {
					console.log(`⏭️  Agent ${agent.prenom} ${agent.nom} déjà existant.`);
				}

				// let user = await User.findOne({ where: { agentId: agent.id } });
				// if (!user) {
				// 	await User.create({
				// 		agentId: agent.id,
				// 		password: "$2b$10$r.GCSc5yfAv.IOSUo0CjX./y6mVbv13Ybl3I5XKgh0mfgfKY3BKVm", // Le mot de passe sera hashé par le hook
				// 		roleId: allRoles[Math.floor(Math.random() * allRoles.length)].id,
				// 		email: `${Math.floor(Math.random() * 19900)}${agent.email}`,
				// 		isActive: true,
				// 	});
				// 	console.log(`  ✅ Utilisateur ${agentInfo.prenom.toLowerCase()} créé.`);
				// } else {
				// 	console.log(`  ⏭️  Utilisateur ${agentInfo.prenom.toLowerCase()} déjà existant.`);
				// }
			}
		}

		// === Affecter les composants des modules Accueil, Communication et GAD - Administration à l'utilisateur admin
		console.log(
			"\n=== Affecter les composants des modules Accueil, Communication et GAD - Administration à l'utilisateur admin\n",
		);
		const modulesToAffect = ["Accueil", "GAD - Administration"];
		const adminUser = await User.findOne({
			where: { email: adminAgent.email },
			include: { model: Role, as: "role" },
		});
		if (adminUser) {
			for (const moduleName of modulesToAffect) {
				const module = await Module.findOne({ where: { name: moduleName } });
				if (!module) continue;
				const components = await Component.findAll({ where: { moduleId: module.id } });
				for (const component of components) {
					const already = await userComponent.findOne({
						where: { userId: adminUser.id, componentId: component.id },
					});

					if (!already) {
						await userComponent.create({
							userId: adminUser.id,
							componentId: component.id,
							grantedBy: "admin",
						});
						console.log(`Composant '${component.name}' affecté à l'utilisateur admin`);
					} else {
						console.log(`Composant '${component.name}' déjà affecté à l'utilisateur admin`);
					}
					// Vérifier et insérer dans RoleComponent si nécessaire
					const alreadyRoleComponent = await RoleComponent.findOne({
						where: { roleId: (adminUser as any).role.id, componentId: component.id },
					});
					if (!alreadyRoleComponent) {
						await RoleComponent.create({
							roleId: (adminUser as any).role.id,
							componentId: component.id,
						});
						console.log(
							`Composant '${component.name}' lié au rôle '${(adminUser as any).role.name}'`,
						);
					} else {
						console.log(
							`Composant '${component.name}' déjà lié au rôle '${(adminUser as any).role.name}'`,
						);
					}
				}
			}
		}

		console.log("\n=== Affectation des composants aux rôles ===");

		// 7. Affecter les composants de base à tous les rôles
		await assignRolesToComponents(
			[
				"Administrateur Système",
				"Recteur",
				"SGAD",
				"Assistant SGAD",
				"Secreatire du SGAD",
				"DRH",
				"Assistant du DRH",
				"Directeur Patrimoine",
				"Assistant du Dir. Patrimoine",
				"Agent des Ressources Humaines",
				"DIROE",
				"Assistant DIROE",
				"Agent du Patrimoine",
				"Dir. Numérisation et Archivage",
				"Dir. des Mutuelles et Assurances",
				"Agent Mutuelles et Assurances",
				"Agent Numérisation et Archivage",
				"Agent",
			],
			["Tableau de bord"],
		);
		const allComponents = await Component.findAll();
		const allComponentNames = allComponents.map((c) => c.name);
		await assignRolesToComponents(["Administrateur Système"], allComponentNames);

		console.log(`\n === Affectation de tous les composant du module RH au DRH et a son assistant`);
		const moduleRh = await Module.findOne({ where: { name: "Ressources Humaines" } });
		if (moduleRh) {
			const componentsRh = await Component.findAll({ where: { moduleId: moduleRh.id } });
			const componentNamesRh = componentsRh.map((c) => c.name);
			await assignRolesToComponents(
				["DRH", "Assistant du DRH", "Agent des Ressources Humaines"],
				componentNamesRh,
				moduleRh.id,
			);
		} else {
			console.log("⚠️  Attention: Le module 'Ressources Humaines' n'a pas été trouvé.");
		}

		// === Affecter les composants de base à tous les rôles
		await assignRolesToComponents(
			[
				"Recteur",
				"SGAD",
				"Assistant SGAD",
				"Secreatire du SGAD",
				"DRH",
				"Agent",
				"Assistant du DRH",
				"Directeur Patrimoine",
				"Assistant du Dir. Patrimoine",
				"DIROE",
				"Assistant DIROE",
				"Agent des Ressources Humaines",
				"Administrateur Système",
				"Agent du Patrimoine",
				"Dir. Numérisation et Archivage",
				"Dir. des Mutuelles et Assurances",
				"Agent Mutuelles et Assurances",
				"Agent Numérisation et Archivage",
				"Agent",
			],
			["Tableau de bord"],
		);

		// === Lancement des seeders supplémentaires ===
		console.log("\n=== Lancement des seeders supplémentaires ===");
		await seedConges();
		await seedPrets();
		await seedEvaluations();
		await seedDiscipline();
		await seedPromotions();
		await seedTrainings();
		await seedRemunerations();
		await seedRetraites();
		await seedRecrutements();
		await seedPersonnelMovements();
		await seedDocumentsRessourceHumaine();
		await seedSocialSupports();
		await seedReclammations();
		await seedAuditLogs();
		await seedTaskForecasts();
		await seedDirectionAgents();
		await seedAgentDirections();
	} catch (error) {
		console.error("❌ Erreur détaillée lors de l'initialisation de la base de données:", error);
		throw error;
	} finally {
		console.log("🔌 Connexion à la base de données fermée.");
	}
}

(async () => {
	try {
		await seed();
		console.log("\n🎉 --- Initialisation de la base de données terminée --- 🎉");
		process.exit(0);
	} catch (error) {
		console.error("\n❌ --- Échec de l'initialisation de la base de données --- ❌");
		console.error(error);
		process.exit(1);
	}
})();
