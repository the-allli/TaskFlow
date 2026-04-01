import path, { dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const ROOT_DIR = path.join(__dirname, "..");
export const VIEWS_DIR = path.join(__dirname, "..", "views");
