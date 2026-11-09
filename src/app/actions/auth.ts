// src/app/actions/auth.ts
"use server";

import {
  createSession,
  destroySession,
  verifyPin,
  setCustomPin,
} from "@/lib/auth";
import { redirect } from "next/navigation";

export async function loginWithPinAction(pin: string) {
  if (!pin || !pin.trim()) {
    return { error: "Mohon masukkan PIN keamanan." };
  }

  const isValid = await verifyPin(pin);
  if (!isValid) {
    return {
      error:
        "PIN SALAH! PIN default adalah 2026. Silakan coba lagi atau gunakan tombol PIN Cepat 2026.",
    };
  }

  await createSession();
  redirect("/");
}

export async function updatePinAction(currentPin: string, newPin: string) {
  if (!newPin || newPin.trim().length < 4) {
    return { error: "PIN baru minimal 4 karakter/angka." };
  }

  const isValid = await verifyPin(currentPin);
  if (!isValid) {
    return { error: "PIN lama salah. Gunakan PIN aktif (Default: 2026)." };
  }

  setCustomPin(newPin.trim());
  await createSession();
  redirect("/");
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}
