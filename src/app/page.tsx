import { PrismaClient } from "@prisma/client";
import { unstable_noStore as noStore, revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const globalForPrisma = globalThis as typeof globalThis & {
  prisma?: PrismaClient;
};

const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

const NETWORK_OPTIONS = [
  {
    value: "SOLANA",
    label: "Solana",
    shortLabel: "SOL",
    badgeClass: "border-emerald-200 bg-emerald-50 text-emerald-700",
  },
  {
    value: "ETHEREUM",
    label: "Ethereum",
    shortLabel: "ETH",
    badgeClass: "border-sky-200 bg-sky-50 text-sky-700",
  },
  {
    value: "BASE",
    label: "Base",
    shortLabel: "BASE",
    badgeClass: "border-violet-200 bg-violet-50 text-violet-700",
  },
] as const;

type WalletNetwork = (typeof NETWORK_OPTIONS)[number]["value"];
type WalletRow = {
  address: string;
  name: string | null;
  network: WalletNetwork;
  isActive: boolean;
};

type PageProps = {
  searchParams?:
    | Record<string, string | string[] | undefined>
    | Promise<Record<string, string | string[] | undefined>>;
};

const FEEDBACK_COPY: Record<
  string,
  {
    title: string;
    description: string;
    tone: string;
  }
> = {
  created: {
    title: "Wallet berhasil ditambahkan",
    description: "Alamat wallet baru sudah masuk ke daftar pantauan paus.",
    tone: "border-emerald-200 bg-emerald-50 text-emerald-700",
  },
  updated: {
    title: "Wallet diperbarui",
    description: "Alias atau status wallet sudah disinkronkan kembali.",
    tone: "border-sky-200 bg-sky-50 text-sky-700",
  },
  invalid: {
    title: "Input belum valid",
    description: "Cek lagi alamat wallet, network, dan alias yang dimasukkan.",
    tone: "border-amber-200 bg-amber-50 text-amber-700",
  },
  failed: {
    title: "Penyimpanan gagal",
    description:
      "Ada kendala saat menyimpan data ke database. Coba lagi sebentar.",
    tone: "border-rose-200 bg-rose-50 text-rose-700",
  },
};

function normalizeAddress(address: string, network: WalletNetwork): string {
  const trimmedAddress = address.trim();
  return network === "SOLANA" ? trimmedAddress : trimmedAddress.toLowerCase();
}

function isValidAddress(address: string, network: WalletNetwork): boolean {
  if (network === "SOLANA") {
    return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);
  }

  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

function getNetworkMeta(network: WalletNetwork) {
  return (
    NETWORK_OPTIONS.find((option) => option.value === network) ??
    NETWORK_OPTIONS[0]
  );
}

function formatAddress(address: string): string {
  if (address.length <= 18) {
    return address;
  }

  return `${address.slice(0, 8)}...${address.slice(-8)}`;
}

function getFirstParam(
  value: string | string[] | undefined,
): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

async function unwrapSearchParams(
  input: PageProps["searchParams"],
): Promise<Record<string, string | string[] | undefined>> {
  if (!input) {
    return {};
  }

  if (
    typeof (input as Promise<Record<string, string | string[] | undefined>>)
      .then === "function"
  ) {
    return await input;
  }

  return input;
}

async function loadWallets(): Promise<{
  wallets: WalletRow[];
  databaseReady: boolean;
}> {
  try {
    const wallets = await prisma.wallet.findMany({
      select: {
        address: true,
        name: true,
        network: true,
        isActive: true,
      },
      orderBy: [{ isActive: "desc" }, { name: "asc" }, { address: "asc" }],
    });

    return {
      wallets: wallets as WalletRow[],
      databaseReady: true,
    };
  } catch (error) {
    console.error("Failed to load wallets:", error);

    return {
      wallets: [],
      databaseReady: false,
    };
  }
}

async function createWalletAction(formData: FormData) {
  "use server";

  const rawAddress = String(formData.get("address") ?? "").trim();
  const rawName = String(formData.get("name") ?? "").trim();
  const rawNetwork = String(formData.get("network") ?? "")
    .trim()
    .toUpperCase();

  const network = NETWORK_OPTIONS.some((option) => option.value === rawNetwork)
    ? (rawNetwork as WalletNetwork)
    : null;

  if (!rawAddress || !rawName || !network) {
    redirect("/?feedback=invalid");
  }

  const normalizedAddress = normalizeAddress(rawAddress, network);

  if (!isValidAddress(normalizedAddress, network)) {
    redirect("/?feedback=invalid");
  }

  try {
    const existingWallet = await prisma.wallet.findFirst({
      where: {
        address: normalizedAddress,
        network,
      },
      select: {
        address: true,
      },
    });

    if (existingWallet) {
      await prisma.wallet.updateMany({
        where: {
          address: normalizedAddress,
          network,
        },
        data: {
          name: rawName,
          isActive: true,
        },
      });

      revalidatePath("/");
      redirect("/?feedback=updated");
    }

    await prisma.wallet.create({
      data: {
        address: normalizedAddress,
        name: rawName,
        network,
        isActive: true,
      },
    });

    revalidatePath("/");
    redirect("/?feedback=created");
  } catch (error) {
    console.error("Failed to save wallet:", error);
    redirect("/?feedback=failed");
  }
}

export default async function Page({ searchParams }: PageProps) {
  noStore();

  const params = await unwrapSearchParams(searchParams);
  const feedbackKey = getFirstParam(params.feedback);
  const feedback = feedbackKey ? FEEDBACK_COPY[feedbackKey] : null;

  const { wallets, databaseReady } = await loadWallets();
  const totalWallets = wallets.length;
  const activeWallets = wallets.filter((wallet) => wallet.isActive).length;
  const monitoredNetworks = new Set(wallets.map((wallet) => wallet.network))
    .size;

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(15,23,42,0.06),_transparent_40%),linear-gradient(180deg,_#f8fafc_0%,_#eef2ff_100%)] text-slate-950">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-8 px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
        <section className="overflow-hidden rounded-[32px] border border-slate-800 bg-slate-950 text-white shadow-[0_30px_80px_rgba(15,23,42,0.18)]">
          <div className="grid gap-8 px-6 py-8 sm:px-8 lg:grid-cols-[minmax(0,1.3fr)_420px] lg:px-10 lg:py-10">
            <div className="space-y-5">
              <span className="inline-flex items-center rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-200">
                Multi-Chain Whale Tracker
              </span>
              <div className="space-y-3">
                <h1 className="max-w-2xl text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                  Registrasi wallet paus dengan tampilan dashboard yang clean
                  dan siap dipantau real-time.
                </h1>
                <p className="max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
                  Tambahkan alamat wallet untuk Solana, Ethereum, atau Base.
                  Semua data ditampilkan dalam layout yang terasa seperti panel
                  operasional finansial: ringkas, rapi, dan mudah dipindai.
                </p>
              </div>
            </div>

            <div className="grid gap-4 rounded-[28px] border border-white/10 bg-white/5 p-5 backdrop-blur">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
                  Total Wallet
                </p>
                <p className="mt-2 text-3xl font-semibold text-white">
                  {totalWallets}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
                    Active
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-white">
                    {activeWallets}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
                    Networks
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-white">
                    {monitoredNetworks}
                  </p>
                </div>
              </div>
              <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm text-emerald-100">
                Wallet aktif akan siap dipakai oleh backend webhook untuk alert
                transaksi whale.
              </div>
            </div>
          </div>
        </section>

        {feedback ? (
          <div
            className={`rounded-2xl border px-4 py-3 shadow-sm ${feedback.tone}`}
          >
            <p className="text-sm font-semibold">{feedback.title}</p>
            <p className="mt-1 text-sm opacity-90">{feedback.description}</p>
          </div>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
          <section className="rounded-[28px] border border-slate-200 bg-white/90 p-6 shadow-[0_24px_60px_rgba(15,23,42,0.08)] backdrop-blur">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                Add Whale Wallet
              </p>
              <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
                Input wallet baru
              </h2>
              <p className="text-sm leading-6 text-slate-500">
                Masukkan alamat wallet, pilih jaringan, lalu simpan alias agar
                notifikasi lebih mudah dibaca saat whale bergerak.
              </p>
            </div>

            <form action={createWalletAction} className="mt-6 space-y-5">
              <div className="space-y-2">
                <label
                  htmlFor="address"
                  className="text-sm font-medium text-slate-700"
                >
                  Alamat Wallet
                </label>
                <input
                  id="address"
                  name="address"
                  type="text"
                  placeholder="0x... atau alamat Solana"
                  required
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-950 outline-none transition focus:border-slate-400 focus:bg-white focus:ring-4 focus:ring-slate-200"
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="network"
                  className="text-sm font-medium text-slate-700"
                >
                  Network
                </label>
                <select
                  id="network"
                  name="network"
                  defaultValue="SOLANA"
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-950 outline-none transition focus:border-slate-400 focus:bg-white focus:ring-4 focus:ring-slate-200"
                >
                  {NETWORK_OPTIONS.map((network) => (
                    <option key={network.value} value={network.value}>
                      {network.shortLabel} - {network.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="name"
                  className="text-sm font-medium text-slate-700"
                >
                  Alias Wallet
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Contoh: Wintermute Main Treasury"
                  required
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-950 outline-none transition focus:border-slate-400 focus:bg-white focus:ring-4 focus:ring-slate-200"
                />
              </div>

              <button
                type="submit"
                className="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Simpan Wallet
              </button>
            </form>

            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              Format valid: Solana memakai address base58, sedangkan Ethereum
              dan Base memakai format
              <span className="mx-1 rounded bg-white px-1.5 py-0.5 font-mono text-xs text-slate-800">
                0x...
              </span>
              .
            </div>
          </section>

          <section className="rounded-[28px] border border-slate-200 bg-white/90 p-6 shadow-[0_24px_60px_rgba(15,23,42,0.08)] backdrop-blur">
            <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                  Whale Registry
                </p>
                <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
                  Daftar wallet terdaftar
                </h2>
                <p className="text-sm leading-6 text-slate-500">
                  Semua wallet yang tersimpan di Prisma akan muncul di sini dan
                  siap dipakai untuk monitoring webhook.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-right">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                  Data Source
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-800">
                  Prisma / PostgreSQL
                </p>
              </div>
            </div>

            {!databaseReady ? (
              <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-800">
                Database belum siap dibaca. Pastikan Prisma client sudah
                di-generate dan migrasi wallet table sudah dijalankan.
              </div>
            ) : wallets.length === 0 ? (
              <div className="mt-6 rounded-[24px] border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center">
                <p className="text-base font-semibold text-slate-900">
                  Belum ada wallet paus terdaftar
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Isi form di sebelah kiri untuk mulai membangun watchlist whale
                  pertama Anda.
                </p>
              </div>
            ) : (
              <div className="mt-6 overflow-hidden rounded-[24px] border border-slate-200">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                      <tr className="text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                        <th className="px-5 py-4">Alias</th>
                        <th className="px-5 py-4">Address</th>
                        <th className="px-5 py-4">Network</th>
                        <th className="px-5 py-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white">
                      {wallets.map((wallet) => {
                        const networkMeta = getNetworkMeta(wallet.network);

                        return (
                          <tr
                            key={`${wallet.network}:${wallet.address}`}
                            className="hover:bg-slate-50/80"
                          >
                            <td className="px-5 py-4 align-middle">
                              <div>
                                <p className="font-semibold text-slate-900">
                                  {wallet.name || "Unnamed wallet"}
                                </p>
                                <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-400">
                                  Whale Watchlist
                                </p>
                              </div>
                            </td>
                            <td className="px-5 py-4 align-middle">
                              <div
                                className="font-mono text-sm text-slate-700"
                                title={wallet.address}
                              >
                                {formatAddress(wallet.address)}
                              </div>
                            </td>
                            <td className="px-5 py-4 align-middle">
                              <span
                                className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${networkMeta.badgeClass}`}
                              >
                                {networkMeta.shortLabel}
                              </span>
                            </td>
                            <td className="px-5 py-4 align-middle">
                              <span
                                className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                                  wallet.isActive
                                    ? "bg-emerald-50 text-emerald-700"
                                    : "bg-slate-100 text-slate-500"
                                }`}
                              >
                                <span
                                  className={`mr-2 h-2 w-2 rounded-full ${
                                    wallet.isActive
                                      ? "bg-emerald-500"
                                      : "bg-slate-400"
                                  }`}
                                />
                                {wallet.isActive ? "Active" : "Inactive"}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
