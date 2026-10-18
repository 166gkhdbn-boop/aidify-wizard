/* Build: inline deploy.html into the WinterJS wizard app. */
const fs = require("fs");
const path = require("path");

const root = __dirname;
const esc = (s) => s.replace(/\\/g, "\\\\").replace(/`/g, "\\`").replace(/\$/g, "\\$");

const deploy = esc(fs.readFileSync(path.join(root, "src/deploy.html"), "utf8"));
let backend = fs.readFileSync(path.join(root, "src/wizard.js"), "utf8");

backend = backend.replace("__DEPLOY_HTML__", "`" + deploy + "`");

fs.mkdirSync(path.join(root, "app"), { recursive: true });
fs.writeFileSync(path.join(root, "app/app.js"), backend);
console.log("built app/app.js", backend.length, "bytes");
