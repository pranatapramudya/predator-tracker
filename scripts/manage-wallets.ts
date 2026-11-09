// scripts/manage-wallets.ts
/**
 * 💼 PREDATOR TRACKER - WALLET WATCHLIST MANAGER
 * CLI utility untuk mengelola daftar dompet Smart Money di config/watchlist.json
 */

import fs from "fs";
import path from "path";

interface WatchlistWallet {
  name: string;
  address: string;
  network: "SOLANA" | "BASE" | "ETHEREUM";
  isActive: boolean;
  minAlertUsd?: number;
}

const CONFIG_PATH = path.resolve(process.cwd(), "config/watchlist.json");

function loadWatchlist(): WatchlistWallet[] {
  try {
    if (!fs.existsSync(CONFIG_PATH)) {
      fs.writeFileSync(CONFIG_PATH, "[]", "utf-8");
      return [];
    }
    const data = fs.readFileSync(CONFIG_PATH, "utf-8");
    return JSON.parse(data);
  } catch {
    return [];
  }
}

function saveWatchlist(wallets: WatchlistWallet[]) {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(wallets, null, 2), "utf-8");
}

function detectNetwork(address: string): "SOLANA" | "BASE" {
  if (address.startsWith("0x") && address.length === 42) {
    return "BASE";
  }
  return "SOLANA";
}

const args = process.argv.slice(2);
const command = args[0] || "list";

switch (command) {
  case "list": {
    const list = loadWatchlist();
    console.log(
      "===============================================================",
    );
    console.log("💼 PREDATOR TRACKER: SMART MONEY WATCHLIST");
    console.log(
      "===============================================================",
    );
    if (list.length === 0) {
      console.log("Watchlist saat ini masih KOSONG.");
      console.log("Tambahkan wallet dengan perintah:");
      console.log(
        '  npm run wallet:add -- <address> "<alias>" [network] [minUsd]\n',
      );
      console.log("Contoh:");
      console.log(
        '  npm run wallet:add -- 7xKXtg... "Alpha Whale 1" SOLANA 15\n',
      );
      break;
    }

    console.log(
      "STATUS   NETWORK   ALIAS                       MIN USD  ADDRESS",
    );
    console.log(
      "--------------------------------------------------------------------------------",
    );
    list.forEach((w) => {
      const statusStr = w.isActive ? "🟢 ACTIVE " : "⚪ PAUSED ";
      const netStr = w.network.padEnd(9);
      const nameStr = (w.name || "Unnamed").padEnd(27);
      const minStr = `$${(w.minAlertUsd ?? 15).toString().padEnd(7)}`;
      console.log(`${statusStr} ${netStr} ${nameStr} ${minStr} ${w.address}`);
    });
    console.log(
      "--------------------------------------------------------------------------------\n",
    );
    break;
  }

  case "add": {
    const address = args[1]?.trim();
    if (!address) {
      console.error(
        "❌ Masukkan alamat wallet. Contoh: npm run wallet:add -- <address> [alias]",
      );
      process.exit(1);
    }

    const alias =
      args[2]?.trim() || `Whale #${Date.now().toString().slice(-4)}`;
    const networkArg = args[3]?.toUpperCase();
    const network: "SOLANA" | "BASE" | "ETHEREUM" =
      networkArg === "BASE" || networkArg === "ETHEREUM"
        ? networkArg
        : detectNetwork(address);
    const minAlertUsd = args[4] ? parseFloat(args[4]) : 15;

    const list = loadWatchlist();
    const exists = list.find(
      (w) => w.address.toLowerCase() === address.toLowerCase(),
    );

    if (exists) {
      console.log(
        `⚠️ Wallet ${address} sudah ada di watchlist (${exists.name}). Memperbarui konfigurasi...`,
      );
      exists.name = alias;
      exists.network = network;
      exists.minAlertUsd = minAlertUsd;
      exists.isActive = true;
    } else {
      list.push({
        name: alias,
        address,
        network,
        isActive: true,
        minAlertUsd,
      });
      console.log(`✅ Sukses menambahkan Smart Money baru!`);
      console.log(`   Alias: ${alias}`);
      console.log(`   Network: ${network}`);
      console.log(`   Address: ${address}`);
      console.log(`   Min Alert: $${minAlertUsd}`);
    }

    saveWatchlist(list);
    break;
  }

  case "remove": {
    const target = args[1]?.trim();
    if (!target) {
      console.error("❌ Masukkan alamat atau alias yang ingin dihapus.");
      process.exit(1);
    }

    const list = loadWatchlist();
    const filtered = list.filter(
      (w) =>
        w.address.toLowerCase() !== target.toLowerCase() &&
        w.name.toLowerCase() !== target.toLowerCase(),
    );

    if (filtered.length === list.length) {
      console.log(
        `⚠️ Tidak ditemukan wallet dengan address/alias "${target}".`,
      );
    } else {
      saveWatchlist(filtered);
      console.log(`🗑️ Berhasil menghapus wallet "${target}" dari watchlist.`);
    }
    break;
  }

  case "toggle": {
    const target = args[1]?.trim();
    if (!target) {
      console.error("❌ Masukkan alamat atau alias yang ingin di-toggle.");
      process.exit(1);
    }

    const list = loadWatchlist();
    const item = list.find(
      (w) =>
        w.address.toLowerCase() === target.toLowerCase() ||
        w.name.toLowerCase() === target.toLowerCase(),
    );

    if (!item) {
      console.log(`⚠️ Tidak ditemukan wallet "${target}".`);
    } else {
      item.isActive = !item.isActive;
      saveWatchlist(list);
      console.log(
        `🔄 Status ${item.name} diubah menjadi: ${item.isActive ? "🟢 ACTIVE" : "⚪ PAUSED"}`,
      );
    }
    break;
  }

  default:
    console.log("Perintah tidak dikenal. Pilihan: list, add, remove, toggle");
}
