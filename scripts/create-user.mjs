// Create (or reset) a staff account.
//
// Usage:
//   npm run user:create -- <doctor|receptionist> <username> "<Full Name>" <password>
//
// Example:
//   npm run user:create -- doctor drmehta "Dr. Anil Mehta" "a-strong-password"
import { openDb, upsertUser } from "./db.mjs";

const [role, username, name, password] = process.argv.slice(2);

if (!role || !username || !name || !password) {
  console.log('Usage: npm run user:create -- <doctor|receptionist> <username> "<Full Name>" <password>');
  process.exit(1);
}

try {
  upsertUser(openDb(), { role, username, name, password });
  console.log(`Saved ${role} account "${username}".`);
} catch (error) {
  console.error(`Could not create user: ${error.message}`);
  process.exit(1);
}
