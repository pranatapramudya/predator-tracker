// src/app/actions/auth.ts
"use server";

import {
  loginUser,
  registerUser,
  createSession,
  destroySession,
} from "@/lib/auth";
import { redirect } from "next/navigation";

export async function loginAction(identifier: string, key: string) {
  if (!identifier || !identifier.trim()) {
    return { error: "Operator identity is required." };
  }
  if (!key || !key.trim()) {
    return { error: "Security access key is required." };
  }

  const result = await loginUser(identifier.trim(), key.trim());
  if (!result.success || !result.user) {
    return {
      error: result.error || "Authentication failed. Invalid credentials.",
    };
  }

  await createSession(result.user.id);
  redirect("/");
}

export async function registerAction(name: string, email: string, key: string) {
  if (!name || !name.trim()) {
    return { error: "Operator name is required." };
  }
  if (!email || !email.trim()) {
    return { error: "Valid email address is required." };
  }
  if (!key || key.trim().length < 4) {
    return { error: "Security access key must be at least 4 characters." };
  }

  const result = await registerUser(name.trim(), email.trim(), key.trim());
  if (!result.success || !result.user) {
    return { error: result.error || "Failed to create operator account." };
  }

  await createSession(result.user.id);
  redirect("/");
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}
