// src/app/actions/auth.ts
"use server";

import { createSession, destroySession, verifyPin } from "@/lib/auth";
import { redirect } from "next/navigation";

export async function loginWithPinAction(pin: string) {
  if (!pin || !pin.trim()) {
    return { error: "Please enter your Security PIN." };
  }

  const isValid = await verifyPin(pin);
  if (!isValid) {
    return { error: "ACCESS DENIED: Invalid Security PIN." };
  }

  await createSession();
  redirect("/");
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}
