import { readFile } from "node:fs/promises";
const sql = await readFile(new URL("./migrations/032_organization_relationships_program_stewardship.sql", import.meta.url), "utf8");

const CONSTRAINT_NAME_RE = /CONSTRAINT\s+(\w+)/gi;
for (const m of sql.matchAll(CONSTRAINT_NAME_RE)) {
  console.log(`idx=${m.index} name="${m[1]}" context="${sql.slice(m.index, m.index+60).replace(/\n/g,'\\n')}"`);
}
console.log("---ALTER TABLE headers---");
const ALTER_TABLE_HEADER_RE = /ALTER TABLE\s+(\w+)/gi;
for (const m of sql.matchAll(ALTER_TABLE_HEADER_RE)) {
  console.log(`idx=${m.index} table="${m[1]}"`);
}
