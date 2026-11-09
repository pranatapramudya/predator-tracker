// src/lib/rugcheck.ts

export interface RugAuditResult {
  isSafe: boolean;
  score: number;
  mintRevoked: boolean;
  mintStatus: string;
  freezeDisabled: boolean;
  freezeStatus: string;
  lpLockedPct: number;
  lpStatus: string;
  top10Pct: number;
  top10Status: string;
  verdict: "SAFE" | "CAUTION" | "DANGER";
  warnings: string[];
}

/**
 * Audit anti-rugpull komprehensif:
 * 1. Verifikasi Liquidity Burnt / Locked (target >= 95% - 100%)
 * 2. Mint Authority Revoked (anti print token tanpa batas)
 * 3. Freeze Authority Disabled (anti honeypot / freeze wallet)
 * 4. Audit Top 10 Holders Concentration (target <= 20% total supply)
 */
export async function auditTokenSecurity(
  tokenAddress: string,
): Promise<RugAuditResult> {
  const warnings: string[] = [];

  try {
    const [summaryRes, reportRes] = await Promise.all([
      fetch(
        `https://api.rugcheck.xyz/v1/tokens/${tokenAddress}/report/summary`,
        { signal: AbortSignal.timeout(6000) },
      ).catch(() => null),
      fetch(`https://api.rugcheck.xyz/v1/tokens/${tokenAddress}/report`, {
        signal: AbortSignal.timeout(6000),
      }).catch(() => null),
    ]);

    const summary =
      summaryRes && summaryRes.ok ? await summaryRes.json() : null;
    const report = reportRes && reportRes.ok ? await reportRes.json() : null;

    if (!summary && !report) {
      return {
        isSafe: false,
        score: -1,
        mintRevoked: false,
        mintStatus: "❓ Unknown (API Timeout)",
        freezeDisabled: false,
        freezeStatus: "❓ Unknown (API Timeout)",
        lpLockedPct: 0,
        lpStatus: "❓ Unknown (API Timeout)",
        top10Pct: 0,
        top10Status: "❓ Unknown (API Timeout)",
        verdict: "CAUTION",
        warnings: ["RugCheck API timeout, proceed with caution"],
      };
    }

    // 1. MINT AUTHORITY
    let mintRevoked = true;
    if (report && report.mintAuthority !== undefined) {
      mintRevoked = report.mintAuthority === null;
    } else if (summary?.risks) {
      mintRevoked = !summary.risks.some((r: any) =>
        r.name?.toLowerCase().includes("mint"),
      );
    }
    const mintStatus = mintRevoked
      ? "✅ Revoked (Immutable)"
      : "🚫 ENABLED (Dev can print tokens!)";
    if (!mintRevoked)
      warnings.push("Mint authority enabled (Inflation danger)");

    // 2. FREEZE AUTHORITY
    let freezeDisabled = true;
    if (report && report.freezeAuthority !== undefined) {
      freezeDisabled = report.freezeAuthority === null;
    } else if (summary?.risks) {
      freezeDisabled = !summary.risks.some((r: any) =>
        r.name?.toLowerCase().includes("freeze"),
      );
    }
    const freezeStatus = freezeDisabled
      ? "✅ Disabled (Honeypot-Proof)"
      : "🚫 ENABLED (Honeypot Risk!)";
    if (!freezeDisabled)
      warnings.push("Freeze authority enabled (Honeypot risk)");

    // 3. LP BURNT / LOCKED
    let lpLockedPct = summary?.lpLockedPct ?? 0;
    if (lpLockedPct === 0 && report?.markets && report.markets.length > 0) {
      lpLockedPct = report.markets[0]?.lp?.lpLockedPct ?? 0;
    }
    const isLpLocked100 = lpLockedPct >= 95;
    let lpStatus = "";
    if (isLpLocked100) {
      lpStatus = `🔥 ${lpLockedPct.toFixed(1)}% Burnt/Locked`;
    } else if (lpLockedPct > 50) {
      lpStatus = `⚠️ ${lpLockedPct.toFixed(1)}% Locked (Partial LP)`;
      warnings.push(`Only ${lpLockedPct.toFixed(1)}% LP locked`);
    } else {
      lpStatus = `🚫 Unlocked / Danger (${lpLockedPct.toFixed(1)}%)`;
      warnings.push("LP Unlocked (Rugpull Risk)");
    }

    // 4. TOP 10 HOLDERS CONCENTRATION AUDIT
    let top10Pct = 0;
    if (report?.topHolders && Array.isArray(report.topHolders)) {
      const top10 = report.topHolders.slice(0, 10);
      top10Pct = top10.reduce(
        (acc: number, h: any) => acc + (Number(h.pct) || 0),
        0,
      );
    }
    let top10Status = "";
    if (top10Pct === 0) {
      top10Status = "ℹ️ Normal Distribution";
    } else if (top10Pct <= 15) {
      top10Status = `🟢 ${top10Pct.toFixed(1)}% (Healthy Decentralized)`;
    } else if (top10Pct <= 25) {
      top10Status = `🟡 ${top10Pct.toFixed(1)}% (Moderate)`;
    } else {
      top10Status = `🔴 ${top10Pct.toFixed(1)}% (Dev/Whale Dump Risk!)`;
      warnings.push(`Top 10 holds ${top10Pct.toFixed(1)}% supply`);
    }

    // FINAL VERDICT
    const isRugged = report?.rugged === true;
    const score = summary?.score ?? report?.score ?? 0;

    let verdict: "SAFE" | "CAUTION" | "DANGER" = "SAFE";
    if (
      isRugged ||
      !mintRevoked ||
      !freezeDisabled ||
      lpLockedPct < 50 ||
      top10Pct > 35
    ) {
      verdict = "DANGER";
    } else if (!isLpLocked100 || top10Pct > 20 || score > 400) {
      verdict = "CAUTION";
    }

    const isSafe = verdict === "SAFE";

    return {
      isSafe,
      score,
      mintRevoked,
      mintStatus,
      freezeDisabled,
      freezeStatus,
      lpLockedPct,
      lpStatus,
      top10Pct: Number(top10Pct.toFixed(1)),
      top10Status,
      verdict,
      warnings,
    };
  } catch (error: any) {
    return {
      isSafe: false,
      score: -1,
      mintRevoked: false,
      mintStatus: "❓ Error",
      freezeDisabled: false,
      freezeStatus: "❓ Error",
      lpLockedPct: 0,
      lpStatus: "❓ Error",
      top10Pct: 0,
      top10Status: "❓ Error",
      verdict: "CAUTION",
      warnings: [error.message],
    };
  }
}

/**
 * Backward-compatible helper untuk fungsi lama
 */
export async function getSecurityData(tokenAddress: string) {
  const audit = await auditTokenSecurity(tokenAddress);
  return {
    mint: audit.mintStatus,
    freeze: audit.freezeStatus,
    lp: audit.lpStatus,
    honeypot: audit.freezeDisabled
      ? "🛡️ Not Detected (Simulated)"
      : "🚫 High Risk / Freeze Enabled",
    audit,
  };
}
