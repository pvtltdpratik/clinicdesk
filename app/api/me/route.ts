import { getCurrentUser } from "@/lib/auth";

// GET /api/me → who is logged in and what they may do.
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Not logged in" }, { status: 401 });
  return Response.json(user);
}
