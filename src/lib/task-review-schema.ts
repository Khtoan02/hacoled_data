import { database } from "./auth/server";

let schemaEnsured = false;

export async function ensureTaskReviewSchema() {
  if (schemaEnsured) return;
  const sql = database();
  await sql`ALTER TABLE app_tasks ADD COLUMN IF NOT EXISTS review_status text CHECK (review_status IN ('passed', 'failed'))`;
  await sql`ALTER TABLE app_tasks ADD COLUMN IF NOT EXISTS review_comment text NOT NULL DEFAULT ''`;
  await sql`ALTER TABLE app_tasks ADD COLUMN IF NOT EXISTS reviewed_by uuid REFERENCES app_members(id)`;
  await sql`ALTER TABLE app_tasks ADD COLUMN IF NOT EXISTS reviewer_name text`;
  await sql`ALTER TABLE app_tasks ADD COLUMN IF NOT EXISTS reviewed_at timestamptz`;
  schemaEnsured = true;
}
