import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { HOME_PATH } from "@/lib/permissions";
import { LoginForm } from "./login-form";

export const metadata = { title: "Sign in · Clinic" };

export default function LoginPage() {
  return (
    <main className="flex flex-1 items-center justify-center bg-muted/40 p-4">
      {/* Already signed in? Skip the form and go to the right dashboard. */}
      <Suspense>
        <RedirectIfSignedIn />
      </Suspense>
      <div className="w-full max-w-sm border bg-background p-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Clinic</p>
        <h1 className="mt-1 font-heading text-2xl">Staff sign in</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Doctors and receptionists use the same sign in. You&apos;ll be taken to your dashboard.
        </p>
        <LoginForm />
      </div>
    </main>
  );
}

async function RedirectIfSignedIn() {
  const user = await getCurrentUser();
  if (user) redirect(HOME_PATH[user.role]);
  return null;
}
