// src/app/sign-up/[[...sign-up]]/page.tsx
import { redirect } from "next/navigation";

export default function SignUpPage() {
  redirect("/login");
}
