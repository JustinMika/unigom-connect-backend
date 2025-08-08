import multer from "multer";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { Request } from "express";

// Configure storage for justifications
const storage = multer.diskStorage({
	destination: (req: Request, file: Express.Multer.File, cb) => {
		cb(null, "uploads/justifications/");
	},
	filename: (req: Request, file: Express.Multer.File, cb) => {
		const uniqueSuffix = `${Date.now()}-${uuidv4()}`;
		const ext = path.extname(file.originalname);
		cb(null, `justification-${uniqueSuffix}${ext}`);
	},
});

// Configure storage for agent photos
const photoStorage = multer.diskStorage({
	destination: (req: Request, file: Express.Multer.File, cb) => {
		cb(null, "uploads/agents/photos/");
	},
	filename: (req: Request, file: Express.Multer.File, cb) => {
		const uniqueSuffix = `${Date.now()}-${uuidv4()}`;
		const ext = path.extname(file.originalname);
		cb(null, `agent-photo-${uniqueSuffix}${ext}`);
	},
});

// File filter for justifications
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
	const allowedTypes = [
		"application/pdf",
		"application/msword",
		"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
		"image/jpeg",
		"image/png",
		"image/jpg",
	];

	if (allowedTypes.includes(file.mimetype)) {
		cb(null, true);
	} else {
		cb(
			new Error(
				"Type de fichier non supporté. Seuls les fichiers PDF, DOC, DOCX, JPG, JPEG et PNG sont autorisés.",
			),
		);
	}
};

// File filter for agent photos
const photoFileFilter = (
	req: Request,
	file: Express.Multer.File,
	cb: multer.FileFilterCallback,
) => {
	const allowedTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp"];

	if (allowedTypes.includes(file.mimetype)) {
		cb(null, true);
	} else {
		cb(
			new Error(
				"Type de fichier non supporté. Seuls les images JPG, JPEG, PNG et WEBP sont autorisées.",
			),
		);
	}
};

// Initialize multer with configuration for justifications
const uploadFile = multer({
	storage,
	// fileFilter,
	limits: {
		fileSize: 10 * 1024 * 1024, // 10MB limit
	},
});

// Initialize multer with configuration for agent photos
const uploadAgentPhoto = multer({
	storage: photoStorage,
	fileFilter: photoFileFilter,
	limits: {
		fileSize: 5 * 1024 * 1024, // 5MB limit for photos
	},
});

export default uploadFile;
export { uploadAgentPhoto };
