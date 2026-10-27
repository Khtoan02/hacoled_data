import { test, expect } from "@playwright/test";
import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";

test("legacy role migration preserves credentials and IDs, revokes changed sessions and is rerunnable", async () => {
  const db = new PGlite();
  try {
    await db.exec(readFileSync("db/001-auth.sql", "utf8"));
    const oldRoles = [
      "lead_marketing",
      "executive",
      "sales_hotline",
      "fulltime_coord",
      "intern_seo",
      "intern_video_long",
      "intern_video_short",
      "ai_assistant",
    ];
    for (const [i, role] of oldRoles.entries()) {
      const id = `00000000-0000-4000-8000-${String(i + 1).padStart(12, "0")}`;
      await db.query(
        "INSERT INTO app_members (id,name,email,password_hash,role) VALUES ($1,$2,$3,$4,$5)",
        [id, role, `${role}@legacy.test`, `preserved-hash-${i}`, role],
      );
      await db.query(
        "INSERT INTO app_sessions (token_hash,member_id,expires_at) VALUES ($1,$2,now() + interval '1 day')",
        [`legacy-session-${i}`, id],
      );
    }
    const migration = readFileSync("db/002-member-roles.sql", "utf8");
    await db.exec(migration);
    await db.exec(migration);
    const { rows } = await db.query<{
      id: string;
      role: string;
      active: boolean;
      password_hash: string;
    }>("SELECT id,role,active,password_hash FROM app_members ORDER BY id");
    expect(rows.map((r) => r.role)).toEqual([
      "lead_marketing",
      "executive",
      "sales_hotline",
      "marketing_staff",
      "marketing_intern",
      "marketing_intern",
      "marketing_intern",
      "marketing_staff",
    ]);
    rows.forEach((row, i) => {
      expect(row.password_hash).toBe(`preserved-hash-${i}`);
      expect(row.active).toBe(i !== 7);
      expect(row.id.endsWith(String(i + 1).padStart(12, "0"))).toBeTruthy();
    });
    const sessions = await db.query(
      "SELECT token_hash FROM app_sessions ORDER BY token_hash",
    );
    expect(sessions.rows).toEqual(
      [0, 1, 2].map((i) => ({ token_hash: `legacy-session-${i}` })),
    );
  } finally {
    await db.close();
  }
});
