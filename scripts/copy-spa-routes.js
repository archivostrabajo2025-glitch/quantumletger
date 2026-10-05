import { copyFileSync, existsSync, mkdirSync, rmSync } from "node:fs";
import path from "node:path";

const distDir = path.resolve("dist");
const sourceFile = path.join(distDir, "index.html");

if (!existsSync(sourceFile)) {
  throw new Error("dist/index.html not found. Run the Vite build first.");
}

const routes = [
  "auth",
  "admin",
  "dashboard",
  "admin/wallet",
  "admin/users",
  "admin/verifications",
  "admin/businesses",
  "admin/transactions",
  "admin/international",
  "admin/security",
  "admin/notifications",
  "admin/reports",
  "admin/receipts",
  "admin/settings",
  "dashboard/verification",
  "dashboard/wallet",
  "dashboard/deposit",
  "dashboard/withdraw",
  "dashboard/transactions",
  "dashboard/bank-account",
  "dashboard/international",
  "dashboard/notifications",
  "dashboard/settings"
];

for (const route of routes) {
  const targetDir = path.join(distDir, route);
  const targetFile = path.join(targetDir, "index.html");
  mkdirSync(targetDir, { recursive: true });
  copyFileSync(sourceFile, targetFile);
}

console.log(`SPA route fallbacks copied for ${routes.length} routes.`);
