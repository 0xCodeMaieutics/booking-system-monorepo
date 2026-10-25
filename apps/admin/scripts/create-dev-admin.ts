// Creates the development Admin if missing: pnpm admin:create-dev
import { eq, getDb, schema } from "@tsami/db";

import { DEV_ADMIN } from "../src/lib/dev-admin";
import { adminAccounts } from "../src/server/auth";

if (process.env.NODE_ENV === "production") {
  console.error("Refusing to create the development Admin in production.");
  process.exit(1);
}

const [existing] = await getDb()
  .select({ id: schema.admin.id })
  .from(schema.admin)
  .where(eq(schema.admin.email, DEV_ADMIN.email));
if (existing) {
  console.log(`Development Admin <${DEV_ADMIN.email}> already exists.`);
} else {
  await adminAccounts.create(DEV_ADMIN);
  console.log(`Created development Admin <${DEV_ADMIN.email}>`);
}
process.exit(0);
