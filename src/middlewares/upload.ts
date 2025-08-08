import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import fs from "fs";
import path from "path";

const createUploader = (subfolder: string) => {
	const uploadsRoot = path.join(process.cwd(), "uploads");
	const destinationFolder = path.join(uploadsRoot, subfolder);

	// Créer le dossier de destination s'il n'existe pas
	if (!fs.existsSync(destinationFolder)) {
		fs.mkdirSync(destinationFolder, { recursive: true });
	}

	const storage = multer.diskStorage({
		destination: (req, file, cb) => {
			cb(null, destinationFolder);
		},
		filename: (req, file, cb) => {
			// Nettoyer le nom du fichier pour éviter les problèmes de sécurité et de compatibilité
			const originalName = path.basename(file.originalname).replace(/[^a-zA-Z0-9_.-]/g, "_");
			const uniqueSuffix = `${Date.now()}-${uuidv4().substring(0, 8)}`;
			cb(null, `${uniqueSuffix}-${originalName}`);
		},
	});

	return multer({ storage });
};

export default createUploader;
