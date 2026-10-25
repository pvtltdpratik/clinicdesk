// Imports the medicines CSV into the medicines table (used for autocomplete).
//
//   npm run db:import-medicines                  (reads data/medicines.csv)
//   npm run db:import-medicines -- path/to/file.csv
//
// Expected columns:
//   id,name,price(₹),Is_discontinued,manufacturer_name,type,pack_size_label,
//   short_composition1,short_composition2
import fs from "node:fs";
import readline from "node:readline";
import { openDb } from "./db.mjs";

const csvPath = process.argv[2] ?? "data/medicines.csv";
if (!fs.existsSync(csvPath)) {
  console.error(`CSV file not found: ${csvPath}`);
  process.exit(1);
}

// Splits one CSV line into fields, handling "quoted, values" and "" escapes.
function parseCsvLine(line) {
  const fields = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (inQuotes) {
      if (char === '"' && line[i + 1] === '"') { current += '"'; i++; }
      else if (char === '"') inQuotes = false;
      else current += char;
    } else if (char === '"') inQuotes = true;
    else if (char === ",") { fields.push(current); current = ""; }
    else current += char;
  }
  fields.push(current);
  return fields.map((f) => f.trim().replace(/\s+/g, " "));
}

const db = openDb();
const insert = db.prepare(
  `INSERT OR REPLACE INTO medicines
     (id, name, price, is_discontinued, manufacturer, type, pack_size, composition)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
);

const lines = readline.createInterface({ input: fs.createReadStream(csvPath, "utf8"), crlfDelay: Infinity });

let isHeader = true;
let count = 0;
db.exec("BEGIN");
db.exec("DELETE FROM medicines");
for await (const line of lines) {
  if (isHeader) { isHeader = false; continue; }
  if (!line.trim()) continue;

  const [id, name, price, discontinued, manufacturer, type, packSize, comp1, comp2] = parseCsvLine(line);
  if (!name) continue;

  const composition = [comp1, comp2].filter(Boolean).join(" + ");
  insert.run(
    Number(id), name, price ? Number(price) : null, discontinued?.toUpperCase() === "TRUE" ? 1 : 0,
    manufacturer ?? "", type ?? "", packSize ?? "", composition,
  );
  count++;
}
db.exec("COMMIT");
console.log(`Imported ${count} medicines from ${csvPath}.`);
