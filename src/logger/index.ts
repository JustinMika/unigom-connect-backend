import { createLogger, format, transports } from "winston";

const isDev = process.env.NODE_ENV !== "production";

const logger = createLogger({
	level: isDev ? "debug" : "info",
	format: format.combine(
		format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
		format.errors({ stack: true }),
		format.printf(
			({ timestamp, level, message, stack }) =>
				`[${timestamp}] ${level.toUpperCase()}${stack ? " - " + stack : " "}: ${message}`,
		),
	),
	transports: [
		new transports.Console({
			format: format.combine(
				format.colorize(), // color output for console
				format.simple(),
			),
		}),
		new transports.File({ filename: "logs/error.log", level: "error" }),
		new transports.File({ filename: "logs/combined.log" }),
	],
	exitOnError: false,
});

export default logger;
