import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { HOME_PATH } from "@/lib/permissions";

// "/" just sends people to the right place.
export default function Home() {
  return (
    <Suspense>
      <RedirectHome />
    </Suspense>
  );
}

async function RedirectHome() {
  const user = await getCurrentUser();
  redirect(user ? HOME_PATH[user.role] : "/login");
  return null;
}
