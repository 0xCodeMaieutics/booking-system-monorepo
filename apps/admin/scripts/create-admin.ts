// Creates the first Admin: pnpm admin:create <email> "<name>" <password>
import { adminAccounts } from "../src/server/auth";

const [email, name, password] = process.argv.slice(2);
if (!email || !name || !password || password.length < 10) {
  console.error('Usage: pnpm admin:create <email> "<name>" <password (10+ chars)>');
  process.exit(1);
}

const admin = await adminAccounts.create({ email, name, password });
console.log(`Created Admin ${admin.name} <${admin.email}>`);
process.exit(0);
