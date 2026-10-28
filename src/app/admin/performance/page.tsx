import { redirect } from "next/navigation";
import { validMonth } from "../../../lib/kpis";
export default async function Page({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const { month } = await searchParams;
  redirect(`/admin/kpis?view=review${month && validMonth(month) ? `&month=${month}` : ""}`);
}
