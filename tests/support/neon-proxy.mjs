// Local PostgreSQL-compatible test fixture. Never connects to Neon or production data.
import { PGlite } from "@electric-sql/pglite";
import { createServer } from "node:http";
import { readFileSync } from "node:fs";
const db = new PGlite();
await db.exec(
  readFileSync(new URL("../../db/001-auth.sql", import.meta.url), "utf8"),
);
function raw(result) {
  return {
    fields: result.fields,
    rows: result.rows.map((row) =>
      result.fields.map((field) => {
        const value = row[field.name];
        if (value === null || value === undefined) return null;
        if (typeof value === "boolean") return value ? "t" : "f";
        if (value instanceof Date)
          return value.toISOString().replace("T", " ").replace("Z", "+00");
        return typeof value === "object"
          ? JSON.stringify(value)
          : String(value);
      }),
    ),
    rowCount: result.affectedRows ?? result.rows.length,
    command: "SELECT",
  };
}
const server = createServer(async (req, res) => {
  try {
    if (req.method === "GET") {
      res.writeHead(200);
      res.end("ok");
      return;
    }
    let body = "";
    for await (const chunk of req) body += chunk;
    const payload = JSON.parse(body);
    const run = async (connection, query) =>
      raw(await connection.query(query.query, query.params));
    const result = payload.queries
      ? {
          results: await db.transaction(async (tx) => {
            const results = [];
            for (const query of payload.queries)
              results.push(await run(tx, query));
            return results;
          }),
        }
      : await run(db, payload);
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(result));
  } catch (error) {
    console.error("Fixture SQL failure:", error.message);
    res.writeHead(400, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ message: error.message, code: error.code }));
  }
});
server.listen(54339, "127.0.0.1", () =>
  console.log("Isolated PostgreSQL test fixture ready on 54339"),
);
