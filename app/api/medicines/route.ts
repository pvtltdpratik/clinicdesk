import { all } from "@/lib/db";
import { checkApiPermission } from "@/lib/auth";

// GET /api/medicines?q=dolo  →  up to 15 matching medicines for autocomplete.
// Only users who can write prescriptions may search.
export async function GET(request: Request) {
  const { error } = await checkApiPermission("clinical:write");
  if (error) return error;

  const q = (new URL(request.url).searchParams.get("q") ?? "").trim();
  if (q.length < 2) return Response.json([]);

  // Names starting with the search come first, then names that contain it.
  const results = all<{ id: number; name: string; composition: string; pack_size: string; manufacturer: string }>(
    `SELECT id, name, composition, pack_size, manufacturer FROM medicines
     WHERE is_discontinued = 0 AND (name LIKE ? OR name LIKE ?)
     ORDER BY CASE WHEN name LIKE ? THEN 0 ELSE 1 END, length(name), name
     LIMIT 15`,
    `${q}%`, `% ${q}%`, `${q}%`,
  );
  return Response.json(results);
}
