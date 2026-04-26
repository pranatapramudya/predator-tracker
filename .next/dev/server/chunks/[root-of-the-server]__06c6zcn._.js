module.exports = [
"[externals]/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-route-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/after-task-async-storage.external.js [external] (next/dist/server/app-render/after-task-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/after-task-async-storage.external.js", () => require("next/dist/server/app-render/after-task-async-storage.external.js"));

module.exports = mod;
}),
"[project]/src/lib/prisma.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "prisma",
    ()=>prisma
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f40$prisma$2f$client$29$__ = __turbopack_context__.i("[externals]/@prisma/client [external] (@prisma/client, cjs, [project]/node_modules/@prisma/client)");
;
const globalForPrisma = globalThis;
const prisma = globalForPrisma.prisma || new __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f40$prisma$2f$client$29$__["PrismaClient"]();
if ("TURBOPACK compile-time truthy", 1) globalForPrisma.prisma = prisma;
}),
"[project]/src/lib/crypto.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getBTCBalance",
    ()=>getBTCBalance,
    "getEVMBalance",
    ()=>getEVMBalance,
    "getEVMLatestTokenTx",
    ()=>getEVMLatestTokenTx,
    "getSolanaBalance",
    ()=>getSolanaBalance,
    "getSolanaLatestSwap",
    ()=>getSolanaLatestSwap
]);
// src/lib/crypto.ts
const HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
};
async function getSolanaBalance(address) {
    const apiKey = process.env.HELIUS_API_KEY;
    const res = await fetch(`https://mainnet.helius-rpc.com/?api-key=${apiKey}&t=${Date.now()}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            ...HEADERS
        },
        body: JSON.stringify({
            jsonrpc: "2.0",
            id: 1,
            method: "getBalance",
            params: [
                address
            ]
        }),
        cache: "no-store"
    });
    if (!res.ok) throw new Error("Solana Network Timeout");
    const data = await res.json();
    if (data.error) throw new Error("Solana API Limit Reached");
    return Number(data.result?.value || 0) / 1_000_000_000;
}
async function getEVMBalance(address, network) {
    // ROUND ROBIN ANTI-LIMIT VERCEL
    const ethRPCs = [
        "https://eth.llamarpc.com",
        "https://rpc.ankr.com/eth",
        "https://ethereum.publicnode.com",
        "https://1rpc.io/eth"
    ];
    const rpcList = network === "ETHEREUM" ? ethRPCs : [
        "https://mainnet.base.org"
    ];
    for (const url of rpcList){
        try {
            const res = await fetch(`${url}?t=${Date.now()}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...HEADERS
                },
                body: JSON.stringify({
                    jsonrpc: "2.0",
                    id: 1,
                    method: "eth_getBalance",
                    params: [
                        address,
                        "latest"
                    ]
                }),
                cache: "no-store"
            });
            if (!res.ok) continue;
            const data = await res.json();
            if (!data.error && data.result !== undefined) {
                return Number(BigInt(data.result)) / 1e18;
            }
        } catch (e) {
            continue;
        }
    }
    throw new Error("EVM All RPCs Timeout/Limit");
}
async function getBTCBalance(address) {
    const cb = Date.now();
    try {
        const res = await fetch(`https://blockchain.info/q/addressbalance/${address}?_=${cb}`, {
            cache: "no-store",
            headers: HEADERS
        });
        if (res.ok) {
            const text = await res.text();
            const bal = Number(text) / 100_000_000;
            if (!isNaN(bal)) return bal;
        }
    } catch (e) {}
    try {
        const res = await fetch(`https://mempool.space/api/address/${address}?_=${cb}`, {
            cache: "no-store",
            headers: HEADERS
        });
        if (res.ok) {
            const data = await res.json();
            if (data.chain_stats) {
                const bal = ((data.chain_stats.funded_txo_sum || 0) - (data.chain_stats.spent_txo_sum || 0)) / 100_000_000;
                if (!isNaN(bal)) return bal;
            }
        }
    } catch (e) {}
    throw new Error("BTC All Engines Timeout");
}
async function getSolanaLatestSwap(address) {
    const apiKey = process.env.HELIUS_API_KEY;
    if (!apiKey) return null;
    try {
        const res = await fetch(`https://api.helius.xyz/v0/addresses/${address}/transactions?api-key=${apiKey}&type=SWAP`, {
            cache: "no-store"
        });
        if (!res.ok) return null;
        const txs = await res.json();
        if (txs && txs.length > 0) {
            const latestTx = txs[0];
            let tokenAddress = "solana";
            let tokenAmount = 0;
            let tokenSymbol = "MEME_COIN";
            let usdValue = 0;
            // 1. Ekstraksi Token Address & Amount
            if (latestTx.tokenTransfers && latestTx.tokenTransfers.length > 0) {
                const transfer = latestTx.tokenTransfers.find((t)=>t.mint !== "So11111111111111111111111111111111111111112") || latestTx.tokenTransfers[0];
                tokenAddress = transfer.mint;
                tokenAmount = transfer.tokenAmount;
            }
            // 2. Integrasi DexScreener untuk Harga Real-time
            if (tokenAddress && tokenAddress !== "solana") {
                try {
                    const dexRes = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${tokenAddress}`, {
                        cache: "no-store"
                    });
                    if (dexRes.ok) {
                        const dexData = await dexRes.json();
                        if (dexData.pairs && dexData.pairs.length > 0) {
                            const pair = dexData.pairs[0];
                            const priceUsd = parseFloat(pair.priceUsd || "0");
                            usdValue = priceUsd * tokenAmount;
                            tokenSymbol = pair.baseToken.symbol || "TOKEN";
                        }
                    }
                } catch (dexError) {
                    console.error("DexScreener Fetch Error:", dexError);
                }
            }
            return {
                signature: latestTx.signature,
                description: latestTx.description || "Melakukan aktivitas Swap Token",
                amount: tokenAmount,
                tokenSymbol: tokenSymbol,
                tokenAddress: tokenAddress,
                usdValue: usdValue > 0 ? Number(usdValue.toFixed(2)) : 0
            };
        }
    } catch (e) {
        console.error("Helius Swap Fetch Error:", e);
    }
    return null;
}
async function getEVMLatestTokenTx(address, network) {
    const apiKey = network === "ETHEREUM" ? process.env.ETHERSCAN_API_KEY : process.env.BASESCAN_API_KEY;
    const baseUrl = network === "ETHEREUM" ? "https://api.etherscan.io/api" : "https://api.basescan.org/api";
    const explorer = network === "ETHEREUM" ? "https://etherscan.io/tx" : "https://basescan.org/tx";
    try {
        const url = `${baseUrl}?module=account&action=tokentx&address=${address}&page=1&offset=1&sort=desc${apiKey ? `&apikey=${apiKey}` : ""}`;
        const res = await fetch(url, {
            cache: "no-store"
        });
        if (!res.ok) return null;
        const data = await res.json();
        if (data.status === "1" && data.result && data.result.length > 0) {
            const tx = data.result[0];
            const isReceive = tx.to.toLowerCase() === address.toLowerCase();
            const action = isReceive ? "🟢 TERIMA/BELI" : "🔴 KIRIM/JUAL";
            const amount = Number(tx.value) / Math.pow(10, Number(tx.tokenDecimal));
            const tokenAddress = tx.contractAddress;
            let usdValue = 0;
            let finalTokenSymbol = tx.tokenSymbol || "TOKEN";
            // Integrasi DexScreener untuk EVM
            if (tokenAddress) {
                try {
                    const dexRes = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${tokenAddress}`, {
                        cache: "no-store"
                    });
                    if (dexRes.ok) {
                        const dexData = await dexRes.json();
                        if (dexData.pairs && dexData.pairs.length > 0) {
                            const pair = dexData.pairs[0];
                            const priceUsd = parseFloat(pair.priceUsd || "0");
                            usdValue = priceUsd * amount;
                            finalTokenSymbol = pair.baseToken.symbol || finalTokenSymbol;
                        }
                    }
                } catch (dexError) {
                    console.error(`DexScreener EVM Fetch Error (${network}):`, dexError);
                }
            }
            return {
                signature: tx.hash,
                tokenSymbol: finalTokenSymbol,
                description: `${action} ${amount.toLocaleString("en-US", {
                    maximumFractionDigits: 2
                })} ${finalTokenSymbol}`,
                explorerUrl: `${explorer}/${tx.hash}`,
                amount: amount,
                tokenAddress: tokenAddress,
                usdValue: usdValue > 0 ? Number(usdValue.toFixed(2)) : 0
            };
        }
    } catch (e) {
        console.error(`EVM Token Tx Error (${network}):`, e);
    }
    return null;
}
}),
"[project]/src/app/api/webhook/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GET",
    ()=>GET,
    "dynamic",
    ()=>dynamic
]);
// src/app/api/webhook/route.ts
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/prisma.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$crypto$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/crypto.ts [app-route] (ecmascript)");
;
;
;
const dynamic = "force-dynamic";
// ==========================================
// AUTO WIN-RATE & PnL ENGINE (REAL-TIME)
// ==========================================
async function processAutoWinRate(walletId, isBuy, amountToken, usdValue, tokenAddress, tokenSymbol) {
    if (!tokenAddress || tokenAddress === "solana" || usdValue <= 0) return;
    try {
        const position = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["prisma"].tokenPosition.findUnique({
            where: {
                walletId_tokenAddress: {
                    walletId,
                    tokenAddress
                }
            }
        });
        if (isBuy) {
            // PAUS BELI (AKUMULASI) -> Catat modalnya
            if (position) {
                await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["prisma"].tokenPosition.update({
                    where: {
                        id: position.id
                    },
                    data: {
                        tokenAmount: Number(position.tokenAmount) + amountToken,
                        totalInvestedUsd: Number(position.totalInvestedUsd) + usdValue
                    }
                });
            } else {
                await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["prisma"].tokenPosition.create({
                    data: {
                        walletId,
                        tokenAddress,
                        tokenSymbol,
                        tokenAmount: amountToken,
                        totalInvestedUsd: usdValue
                    }
                });
            }
        } else {
            // PAUS JUAL (TAKE PROFIT / CUT LOSS) -> Kalkulasi WR!
            if (position && Number(position.tokenAmount) > 0) {
                const avgBuyPrice = Number(position.totalInvestedUsd) / Number(position.tokenAmount);
                const costOfSoldTokens = avgBuyPrice * amountToken;
                const pnl = usdValue - costOfSoldTokens; // Profit atau Minus?
                const isWin = pnl > 0; // Cuan!
                const walletStats = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["prisma"].wallet.findUnique({
                    where: {
                        id: walletId
                    }
                });
                if (walletStats) {
                    const newTotalTrades = walletStats.totalTrades + 1;
                    const newSuccessTrades = walletStats.successTrades + (isWin ? 1 : 0);
                    const newWinRate = newSuccessTrades / newTotalTrades * 100; // Hitung persentase
                    // UPDATE REPUTASI PAUS REAL-TIME
                    await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["prisma"].wallet.update({
                        where: {
                            id: walletId
                        },
                        data: {
                            totalTrades: newTotalTrades,
                            successTrades: newSuccessTrades,
                            winRate: newWinRate
                        }
                    });
                    // Update Sisa Posisi Koin
                    const remainingAmount = Math.max(0, Number(position.tokenAmount) - amountToken);
                    await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["prisma"].tokenPosition.update({
                        where: {
                            id: position.id
                        },
                        data: {
                            tokenAmount: remainingAmount,
                            realizedPnlUsd: Number(position.realizedPnlUsd) + pnl
                        }
                    });
                }
            }
        }
    } catch (e) {
        console.error("Auto WR Error:", e);
    }
}
async function GET(request) {
    try {
        const wallets = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["prisma"].wallet.findMany({
            where: {
                isActive: true
            }
        });
        const ALPHA_CHANNEL_ID = "-1003737826938";
        for (const wallet of wallets){
            try {
                const winRate = wallet.winRate || 0;
                const threshold = wallet.minAlertUsd || 100;
                let label = "🐋 THE WHALE";
                if (winRate > 70) label = "🥇 THE ORACLE";
                else if (winRate >= 40) label = "🥈 THE GRINDER";
                else if (winRate > 0 && winRate < 30) label = "💀 EXIT LIQUIDITY";
                let isSwapOrTokenAlertSent = false;
                // ==========================================
                // 1. SMART MONEY SWAP (SOLANA)
                // ==========================================
                if (wallet.network === "SOLANA") {
                    const swapData = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$crypto$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getSolanaLatestSwap"])(wallet.address);
                    if (swapData) {
                        const isExists = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["prisma"].transaction.findFirst({
                            where: {
                                signature: swapData.signature
                            }
                        });
                        if (!isExists) {
                            isSwapOrTokenAlertSent = true;
                            const usdAmount = swapData.usdValue || 0;
                            const amountToken = swapData.amount || 0;
                            const tokenAddress = swapData.tokenAddress || "solana";
                            const tokenSymbol = swapData.tokenSymbol || "MEME_COIN";
                            // DETEKSI BUY ATAU SELL (Solana Logic)
                            const isBuy = !swapData.description.toUpperCase().includes("FOR SOL") && !swapData.description.toUpperCase().includes("FOR USDC");
                            // 🔴 EKSEKUSI AUTO WIN-RATE
                            await processAutoWinRate(wallet.id, isBuy, amountToken, usdAmount, tokenAddress, tokenSymbol);
                            if (usdAmount > 0 && usdAmount < threshold) {
                                console.log(`[SILENT SKIP] Transaksi receh... WR tetap diupdate.`);
                            } else {
                                await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["prisma"].transaction.create({
                                    data: {
                                        walletId: wallet.id,
                                        dedupeKey: `${wallet.id}-${swapData.signature}`,
                                        signature: swapData.signature,
                                        type: "SWAP",
                                        amount: amountToken,
                                        tokenSymbol: tokenSymbol,
                                        usdValue: usdAmount,
                                        explorerUrl: `https://solscan.io/tx/${swapData.signature}`
                                    }
                                });
                                if (process.env.TELEGRAM_BOT_TOKEN) {
                                    const actionText = isBuy ? "🟢 *BUY (AKUMULASI)*" : "🔴 *SELL (TAKE PROFIT/CUT LOSS)*";
                                    const swapMessage = `${label} ALERT!\n🚨 *SMART MONEY SWAP (SOLANA)*\n\n` + `👤 *Target:* ${wallet.name}\n` + `🔄 *Aksi:* ${actionText}\n` + `💵 *Estimasi USD:* $${usdAmount}\n` + `📊 *Current Win Rate:* ${winRate.toFixed(1)}%\n` + `📍 *Address:* \`${wallet.address}\``;
                                    await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
                                        method: "POST",
                                        headers: {
                                            "Content-Type": "application/json"
                                        },
                                        body: JSON.stringify({
                                            chat_id: ALPHA_CHANNEL_ID,
                                            text: swapMessage,
                                            parse_mode: "Markdown",
                                            disable_web_page_preview: true,
                                            reply_markup: {
                                                inline_keyboard: [
                                                    [
                                                        {
                                                            text: "📈 View on DexScreener",
                                                            url: `https://dexscreener.com/solana/${tokenAddress}`
                                                        }
                                                    ],
                                                    [
                                                        {
                                                            text: "🔍 Cek TX",
                                                            url: `https://solscan.io/tx/${swapData.signature}`
                                                        }
                                                    ]
                                                ]
                                            }
                                        })
                                    });
                                }
                            }
                        }
                    }
                }
                // ==========================================
                // 2. SMART MONEY TOKEN (ETH & BASE)
                // ==========================================
                if (wallet.network === "ETHEREUM" || wallet.network === "BASE") {
                    const tokenTx = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$crypto$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getEVMLatestTokenTx"])(wallet.address, wallet.network);
                    if (tokenTx) {
                        const isExists = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["prisma"].transaction.findFirst({
                            where: {
                                signature: tokenTx.signature
                            }
                        });
                        if (!isExists) {
                            isSwapOrTokenAlertSent = true;
                            const usdAmount = tokenTx.usdValue || 0;
                            const amountToken = tokenTx.amount || 0;
                            const tokenAddress = tokenTx.tokenAddress;
                            const tokenSymbol = tokenTx.tokenSymbol || "TOKEN";
                            // DETEKSI BUY ATAU SELL (EVM Logic)
                            const isBuy = tokenTx.description.includes("🟢");
                            // 🔴 EKSEKUSI AUTO WIN-RATE
                            await processAutoWinRate(wallet.id, isBuy, amountToken, usdAmount, tokenAddress, tokenSymbol);
                            if (usdAmount > 0 && usdAmount < threshold) {
                                console.log(`[SILENT SKIP] Transaksi EVM receh... WR tetap diupdate.`);
                            } else {
                                await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["prisma"].transaction.create({
                                    data: {
                                        walletId: wallet.id,
                                        dedupeKey: `${wallet.id}-${tokenTx.signature}`,
                                        signature: tokenTx.signature,
                                        type: "ERC20_TRANSFER",
                                        amount: amountToken,
                                        tokenSymbol: tokenSymbol,
                                        usdValue: usdAmount,
                                        explorerUrl: tokenTx.explorerUrl
                                    }
                                });
                                if (process.env.TELEGRAM_BOT_TOKEN) {
                                    const tokenMessage = `${label} ALERT!\n🚨 *SMART MONEY TOKEN (${wallet.network})*\n\n` + `👤 *Target:* ${wallet.name}\n` + `🔄 *Aksi:* ${tokenTx.description}\n` + `💵 *Estimasi USD:* $${usdAmount}\n` + `📊 *Current Win Rate:* ${winRate.toFixed(1)}%\n` + `📍 *Address:* \`${wallet.address}\``;
                                    await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
                                        method: "POST",
                                        headers: {
                                            "Content-Type": "application/json"
                                        },
                                        body: JSON.stringify({
                                            chat_id: ALPHA_CHANNEL_ID,
                                            text: tokenMessage,
                                            parse_mode: "Markdown",
                                            disable_web_page_preview: true,
                                            reply_markup: {
                                                inline_keyboard: [
                                                    [
                                                        {
                                                            text: "🔍 Cek TX di Explorer",
                                                            url: tokenTx.explorerUrl
                                                        }
                                                    ]
                                                ]
                                            }
                                        })
                                    });
                                }
                            }
                        }
                    }
                }
                // ==========================================
                // 3. WHALE ALERT SALDO UMUM (DIAM-DIAM)
                // ==========================================
                let currentBalance = 0;
                if (wallet.network === "SOLANA") {
                    currentBalance = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$crypto$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getSolanaBalance"])(wallet.address);
                } else if (wallet.network === "ETHEREUM" || wallet.network === "BASE") {
                    currentBalance = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$crypto$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getEVMBalance"])(wallet.address, wallet.network);
                } else if (wallet.network === "BITCOIN") {
                    currentBalance = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$crypto$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getBTCBalance"])(wallet.address);
                }
                const oldBalance = Number(wallet.lastBalance || 0);
                const diff = currentBalance - oldBalance;
                if (Math.abs(diff) > 0.00000001) {
                    await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["prisma"].wallet.update({
                        where: {
                            id: wallet.id
                        },
                        data: {
                            lastBalance: currentBalance
                        }
                    });
                    if (!isSwapOrTokenAlertSent && wallet.chatId && process.env.TELEGRAM_BOT_TOKEN) {
                        const sym = wallet.network === "BITCOIN" ? "₿" : wallet.network === "SOLANA" ? "◎" : "Ξ";
                        const message = `${label} ALERT!\n🚨 *WHALE BALANCE UPDATE*\n\n` + `👤 *Target:* ${wallet.name}\n` + `🌐 *Network:* ${wallet.network}\n` + `💼 *Saldo Lama:* ${sym} ${oldBalance.toFixed(8)}\n` + `💰 *Saldo Baru:* ${sym} ${currentBalance.toFixed(8)}\n` + `📊 *Perubahan:* ${sym} ${Math.abs(diff).toFixed(8)}\n` + `📍 *Address:* \`${wallet.address}\``;
                        await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json"
                            },
                            body: JSON.stringify({
                                chat_id: wallet.chatId,
                                text: message,
                                parse_mode: "Markdown"
                            })
                        });
                    }
                }
            } catch (innerError) {
                console.error(`Gagal ngecek wallet ${wallet.name}:`, innerError);
            }
        }
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            success: true,
            message: "Radar Predator Selesai Menyapu Semua Jaringan"
        });
    } catch (error) {
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            success: false,
            error: "Gagal menyapu radar"
        }, {
            status: 500
        });
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__06c6zcn._.js.map