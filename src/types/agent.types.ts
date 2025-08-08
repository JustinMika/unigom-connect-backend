export type Sexe = "M" | "F" | "Autres";

export type EtatCivil = "célibataire" | "marié(e)" | "divorcé(e)" | "veuf(ve)";

export type StatutAgent = "actif" | "suspendu" | "retraité" | "fin de contract" | "revoquer";

export type SituationAdministrative = "permanent" | "contractuel" | "stagiaire" | "temporaire";

export type TypeAgent = "temps plein" | "temps partiel";

export interface AgentAttributes {
	id: number;
	matricule: string;
	nom: string;
	postnom: string;
	prenom: string;
	sexe: Sexe;
	dateNaissance: Date;
	lieuNaissance: string;
	nationalite: string;
	provinceOrigine: string;
	villeResidence: string;
	adresseComplete: string;
	telephone?: string;
	email: string;
	etatCivil: EtatCivil;
	photo?: string;
	statut: StatutAgent;
	posteId: number;
	gradeId: number;
	categorieId: number;
	affectationId: number;
	situationAdministrative: SituationAdministrative;
	typeAgent: TypeAgent;
	dateEmbauche: Date;
	numCnas: string;
	createdAt?: Date;
	updatedAt?: Date;
}

export interface AgentCreationAttributes {
	matricule: string;
	nom: string;
	postnom: string;
	prenom: string;
	sexe: Sexe;
	dateNaissance: Date;
	lieuNaissance: string;
	nationalite: string;
	provinceOrigine: string;
	villeResidence: string;
	adresseComplete: string;
	telephone?: string;
	email: string;
	etatCivil: EtatCivil;
	photo?: string;
	statut: StatutAgent;
	posteId: number;
	gradeId: number;
	categorieId: number;
	affectationId: number;
	situationAdministrative: SituationAdministrative;
	typeAgent: TypeAgent;
	dateEmbauche: Date;
	numCnas: string;
}

export interface AgentUpdateAttributes extends Partial<AgentCreationAttributes> {
	id: number;
}

export interface DeclarationDependantAttributes {
	id: number;
	nom: string;
	postnom: string;
	prenom: string;
	sexe: "M" | "F" | "Autres";
	dateNaissance: Date;
	lieuNaissance: string;
	nationalite: string;
	numActeNaissance: string;
	etatCivil: "célibataire" | "marié(e)" | "divorcé(e)" | "veuf(ve)";
	niveauEtude: string;
	adresseResidence: string;
	degreParente:
		| "Parents"
		| "Enfants"
		| "Frère"
		| "Sœur"
		| "Grand-parent"
		| "Petit-enfant"
		| "Oncle"
		| "Tante"
		| "Neveu"
		| "Nièce"
		| "Cousin"
		| "Cousine";
	agentId: number;
}

export interface AgentWithRelations extends AgentAttributes {
	poste?: PosteAgentAttributes;
	grade?: GradeAgentAttributes;
	categorie?: CategorieAgentAttributes;
	affectation?: AffectationAttributes;
	directions?: DirectionAgentAttributes[];
	user?: UserAttributes;
	dependants?: DeclarationDependantAttributes[];
}

export interface PosteAgentAttributes {
	id: number;
	nom: string;
}

export interface GradeAgentAttributes {
	id: number;
	nom: string;
}

export interface CategorieAgentAttributes {
	id: number;
	nom: string;
}

export interface AffectationAttributes {
	id: number;
	nom: string;
}

export interface DirectionAgentAttributes {
	id: number;
	nom: string;
}

export interface UserAttributes {
	id: number;
	email: string;
	role: string;
}

export interface AgentSearchParams {
	page?: number;
	limit?: number;
	search?: string;
	q?: string;
}

export interface AgentSearchResponse {
	success: boolean;
	data: AgentWithRelations[];
	pagination?: {
		currentPage: number;
		totalPages: number;
		totalItems: number;
		itemsPerPage: number;
	};
	message: string;
}

export interface AgentResponse {
	success: boolean;
	data: AgentWithRelations;
	message: string;
}

export interface AgentCreateRequest {
	matricule: string;
	nom: string;
	postnom: string;
	prenom: string;
	sexe: Sexe;
	dateNaissance: string;
	lieuNaissance: string;
	nationalite: string;
	provinceOrigine: string;
	villeResidence: string;
	adresseComplete: string;
	telephone?: string;
	email: string;
	etatCivil?: EtatCivil;
	photo?: string;
	posteId: number;
	gradeId: number;
	categorieId: number;
	affectationId: number;
	directionIds?: number[];
	statut?: StatutAgent;
	situationAdministrative?: SituationAdministrative;
	typeAgent?: TypeAgent;
	dateEmbauche?: string;
	numCnas?: string;
}

export interface AgentUpdateRequest extends Partial<AgentCreateRequest> {
	id: number;
}

export interface AgentStatutUpdateRequest {
	statut: StatutAgent;
}
