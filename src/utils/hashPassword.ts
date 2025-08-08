import bcrypt from "bcrypt";

/**
 * Classe utilitaire pour la gestion des mots de passe
 */
export class PasswordUtils {
	/**
	 * Nombre de rounds pour le hachage bcrypt (10 par défaut)
	 */
	private static readonly SALT_ROUNDS = 10;

	/**
	 * Hache un mot de passe en utilisant bcrypt
	 * @param password - Le mot de passe en clair à hacher
	 * @returns Promise<string> - Le mot de passe haché
	 * @throws Error si le hachage échoue
	 */
	static async hashPassword(password: string): Promise<string> {
		try {
			if (!password || password.trim().length === 0) {
				throw new Error("Le mot de passe ne peut pas être vide");
			}

			const hashedPassword = await bcrypt.hash(password, this.SALT_ROUNDS);
			return hashedPassword;
		} catch (error) {
			throw new Error(
				`Erreur lors du hachage du mot de passe: ${error instanceof Error ? error.message : "Erreur inconnue"}`,
			);
		}
	}

	/**
	 * Vérifie si un mot de passe correspond au hash fourni
	 * @param password - Le mot de passe en clair à vérifier
	 * @param hashedPassword - Le mot de passe haché stocké
	 * @returns Promise<boolean> - true si le mot de passe correspond, false sinon
	 * @throws Error si la vérification échoue
	 */
	static async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
		try {
			if (!password || password.trim().length === 0) {
				throw new Error("Le mot de passe ne peut pas être vide");
			}

			if (!hashedPassword || hashedPassword.trim().length === 0) {
				throw new Error("Le hash du mot de passe ne peut pas être vide");
			}

			const isValid = await bcrypt.compare(password, hashedPassword);
			return isValid;
		} catch (error) {
			throw new Error(
				`Erreur lors de la vérification du mot de passe: ${error instanceof Error ? error.message : "Erreur inconnue"}`,
			);
		}
	}

	/**
	 * Génère un salt pour le hachage
	 * @param rounds - Nombre de rounds (optionnel, utilise SALT_ROUNDS par défaut)
	 * @returns Promise<string> - Le salt généré
	 */
	static async generateSalt(rounds?: number): Promise<string> {
		try {
			const saltRounds = rounds || this.SALT_ROUNDS;
			const salt = await bcrypt.genSalt(saltRounds);
			return salt;
		} catch (error) {
			throw new Error(
				`Erreur lors de la génération du salt: ${error instanceof Error ? error.message : "Erreur inconnue"}`,
			);
		}
	}

	/**
	 * Vérifie si un hash bcrypt est valide
	 * @param hash - Le hash à valider
	 * @returns boolean - true si le hash est valide, false sinon
	 */
	static isValidHash(hash: string): boolean {
		try {
			if (!hash || hash.trim().length === 0) {
				return false;
			}

			// Vérifier le format du hash bcrypt (commence par $2b$ ou $2a$)
			const bcryptRegex = /^\$2[ab]\$\d{1,2}\$[./A-Za-z0-9]{53}$/;
			return bcryptRegex.test(hash);
		} catch (error) {
			return false;
		}
	}
}

/**
 * Fonctions utilitaires exportées directement pour une utilisation plus simple
 */

/**
 * Hache un mot de passe
 * @param password - Le mot de passe en clair
 * @returns Promise<string> - Le mot de passe haché
 */
export const hashPassword = (password: string): Promise<string> => {
	return PasswordUtils.hashPassword(password);
};

/**
 * Vérifie un mot de passe
 * @param password - Le mot de passe en clair
 * @param hashedPassword - Le mot de passe haché
 * @returns Promise<boolean> - true si le mot de passe correspond
 */
export const verifyPassword = (password: string, hashedPassword: string): Promise<boolean> => {
	return PasswordUtils.verifyPassword(password, hashedPassword);
};

/**
 * Génère un salt
 * @param rounds - Nombre de rounds (optionnel)
 * @returns Promise<string> - Le salt généré
 */
export const generateSalt = (rounds?: number): Promise<string> => {
	return PasswordUtils.generateSalt(rounds);
};

/**
 * Vérifie si un hash est valide
 * @param hash - Le hash à valider
 * @returns boolean - true si le hash est valide
 */
export const isValidHash = (hash: string): boolean => {
	return PasswordUtils.isValidHash(hash);
};
