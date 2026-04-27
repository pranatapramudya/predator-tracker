import { SignUp } from "@clerk/nextjs";

export default function Page() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#080808]">
      <SignUp appearance={{ variables: { colorPrimary: "#10b981" } }} />
    </div>
  );
}
