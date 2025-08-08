import morgan from "morgan";
import logger from "../logger";

const stream = {
	write: (message: string) => logger.http(message.trim()),
};

const skip = () => process.env.NODE_ENV === "test";

const httpLogger = morgan("dev", { stream, skip });

export default httpLogger;
