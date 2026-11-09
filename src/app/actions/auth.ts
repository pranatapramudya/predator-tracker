// src/app/actions/auth.ts
"use server";

import {
  loginUser,
  registerUser,
  resetUserPin,
  createSession,
  destroySession,
} from "@/lib/auth";
import { redirect } from "next/navigation";

export async function loginWithPinAction(pin: string, identifier?: string) {
  if (!pin || !pin.trim()) {
    return { error: "Silakan masukkan PIN Akses Keamanan." };
  }

  const result = await loginUser(identifier || "", pin.trim());
  if (!result.success || !result.user) {
    return {
      error: result.error || "Akses Ditolak: PIN Keamanan tidak valid.",
    };
  }

  await createSession(result.user.id);
  redirect("/");
}

export async function registerAction(name: string, email: string, pin: string) {
  if (!name?.trim()) return { error: "Nama Operator wajib diisi." };
  if (!email?.trim()) return { error: "Email wajib diisi." };
  if (!pin?.trim() || pin.trim().length < 4) {
    return { error: "PIN Keamanan minimal 4 digit angka." };
  }

  const result = await registerUser(name.trim(), email.trim(), pin.trim());
  if (!result.success || !result.user) {
    return { error: result.error || "Gagal mendaftarkan akun baru." };
  }

  await createSession(result.user.id);
  redirect("/");
}

export async function resetPinAction(email: string, newPin: string) {
  if (!email?.trim()) return { error: "Email akun wajib diisi." };
  if (!newPin?.trim() || newPin.trim().length < 4) {
    return { error: "PIN Baru minimal 4 digit angka." };
  }

  const result = await resetUserPin(email.trim(), newPin.trim());
  if (!result.success) {
    return { error: result.error || "Gagal memperbarui PIN." };
  }

  return { success: true };
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}
