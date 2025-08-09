// @ts-nocheck

import path from "path";
import { Sequelize } from "sequelize";
import process from "process";
import dotenv from "dotenv";
dotenv.config({ path: path.resolve(__dirname, "../../.env") });
// @ts-ignore
import configFile from "../config/sequelize-cli-config.js";

const env: string = process.env.NODE_ENV || "development";
const config = configFile[env];
const db: { [key: string]: any } = {};

let sequelize: Sequelize;
if (config.use_env_variable) {
    sequelize = new Sequelize(
        process.env[config.use_env_variable] as string,
        config
    );
} else {
    sequelize = new Sequelize(
        config.database as string,
        config.username as string,
        config.password as string,
        config
    );
}
export { db };
export default sequelize;
