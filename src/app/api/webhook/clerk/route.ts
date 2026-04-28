import { Webhook } from "svix";
import { headers } from "next/headers";
import { WebhookEvent } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    throw new Error("Tolong tambahin CLERK_WEBHOOK_SECRET di .env dulu bre!");
  }

  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response("Error occured -- no svix headers", { status: 400 });
  }

  const payload = await req.json();
  const body = JSON.stringify(payload);
  const wh = new Webhook(WEBHOOK_SECRET);

  let evt: WebhookEvent;

  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error("Error verifying webhook:", err);
    return new Response("Error occured", { status: 400 });
  }

  const eventType = evt.type;

  // 🔥 LOGIKA PEMBERSIH DATABASE 🔥
  if (eventType === "user.deleted") {
    const { id } = evt.data;

    console.log(`[CLEANUP] Menghapus data untuk user: ${id}`);

    // Hapus User. Karena di schema udah dikasih onDelete: Cascade,
    // maka Wallet dan Transaction milik user ini bakal ikut MELEDAK terhapus!
    await prisma.user.delete({
      where: { id: id },
    });
  }

  return new Response("", { status: 200 });
}
