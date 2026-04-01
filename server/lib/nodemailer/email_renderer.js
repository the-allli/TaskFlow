import path from "path";
import ejs from "ejs";
import { VIEWS_DIR } from "../../utils/paths.js";

const renderEmail = async (template, data) => {
  const templatePath = path.join(VIEWS_DIR, "emails", `${template}.ejs`);

  return await ejs.renderFile(templatePath, data);
};

export default renderEmail;
