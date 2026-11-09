// src/app/actions/auth.ts
"use server";

import { loginUser, createSession, destroySession } from "@/lib/auth";
import { redirect } from "next/navigation";

export async function loginWithPinAction(pin: string) {
  if (!pin || !pin.trim()) {
    return { error: "Please enter your Security PIN." };
  }

  const result = await loginUser("admin", pin.trim());
  if (!result.success || !result.user) {
    return { error: "Access Denied: Invalid Security PIN." };
  }

  await createSession(result.user.id);
  redirect("/");
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}
