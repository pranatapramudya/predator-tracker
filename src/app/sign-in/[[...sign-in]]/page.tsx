// src/app/sign-in/[[...sign-in]]/page.tsx
import { redirect } from "next/navigation";

export default function SignInPage() {
  redirect("/login");
}
