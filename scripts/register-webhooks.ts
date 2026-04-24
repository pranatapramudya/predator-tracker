import { Network, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type HeliusCreateWebhookResponse = {
  webhookID: string;
  webhookURL: string;
  accountAddresses: string[];
  webhookType: string;
  authHeader?: string;
  active: boolean;
};

type AlchemyCreateWebhookResponse = {
  data: {
    id: string;
    network: string;
    webhook_type: string;
    webhook_url: string;
    is_active: boolean;
    signing_key: string;
  };
};

function getRequiredEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

async function getActiveAddresses(network: Network): Promise<string[]> {
  const wallets = await prisma.wallet.findMany({
    where: {
      isActive: true,
      network,
    },
    select: {
      address: true,
    },
  });

  return wallets.map((wallet) => wallet.address);
}

async function registerHeliusWebhook(addresses: string[]) {
  const apiKey = getRequiredEnv("HELIUS_API_KEY");
  const webhookUrl = getRequiredEnv("WEBHOOK_URL");
  const sharedSecret = process.env.WEBHOOK_SHARED_SECRET?.trim();

  const response = await fetch(`https://api-mainnet.helius-rpc.com/v0/webhooks?api-key=${apiKey}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      webhookURL: webhookUrl,
      transactionTypes: ["ANY"],
      accountAddresses: addresses,
      webhookType: "enhanced",
      ...(sharedSecret ? { authHeader: `Bearer ${sharedSecret}` } : {}),
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Helius create webhook failed (${response.status}): ${errorText}`);
  }

  return (await response.json()) as HeliusCreateWebhookResponse;
}

async function registerAlchemyWebhook(params: {
  network: "ETH_MAINNET" | "BASE_MAINNET";
  name: string;
  addresses: string[];
}) {
  const authToken = getRequiredEnv("ALCHEMY_AUTH_TOKEN");
  const webhookUrl = getRequiredEnv("WEBHOOK_URL");

  const response = await fetch("https://dashboard.alchemy.com/api/create-webhook", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Alchemy-Token": authToken,
    },
    body: JSON.stringify({
      network: params.network,
      webhook_type: "ADDRESS_ACTIVITY",
      webhook_url: webhookUrl,
      addresses: params.addresses,
      name: params.name,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Alchemy create webhook failed (${response.status}): ${errorText}`);
  }

  return (await response.json()) as AlchemyCreateWebhookResponse;
}

async function main() {
  const [solanaAddresses, ethereumAddresses, baseAddresses] = await Promise.all([
    getActiveAddresses(Network.SOLANA),
    getActiveAddresses(Network.ETHEREUM),
    getActiveAddresses(Network.BASE),
  ]);

  const results: Record<string, unknown> = {};

  if (solanaAddresses.length > 0) {
    results.helius = await registerHeliusWebhook(solanaAddresses);
  }

  if (ethereumAddresses.length > 0) {
    results.alchemyEthereum = await registerAlchemyWebhook({
      network: "ETH_MAINNET",
      name: "Multi-Chain Whale Tracker - Ethereum",
      addresses: ethereumAddresses,
    });
  }

  if (baseAddresses.length > 0) {
    results.alchemyBase = await registerAlchemyWebhook({
      network: "BASE_MAINNET",
      name: "Multi-Chain Whale Tracker - Base",
      addresses: baseAddresses,
    });
  }

  console.log(JSON.stringify(results, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
