// src/app/api/webhook/clerk/route.ts
// Clerk has been replaced by Master PIN authentication.
export async function POST() {
  return new Response(JSON.stringify({ status: "Clerk webhooks disabled" }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
