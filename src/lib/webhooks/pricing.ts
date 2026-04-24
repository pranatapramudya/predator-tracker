type TokenPriceOverride =
  | number
  | {
      symbol?: string;
      usdPrice: number;
    };

type AssetLookupInput = {
  symbol?: string | null;
  identifier?: string | null;
};

type ResolvedAsset = {
  symbol: string;
  usdPrice: number | null;
};

const STABLECOIN_PRICES: Record<string, number> = {
  DAI: 1,
  PYUSD: 1,
  USDBC: 1,
  USDC: 1,
  USDT: 1,
};

const COINGECKO_IDS: Record<string, string> = {
  ETH: "ethereum",
  SOL: "solana",
  WETH: "ethereum",
  WSOL: "solana",
};

const priceCache = new Map<string, { expiresAt: number; value: number }>();

function normalizeIdentifier(value?: string | null): string | undefined {
  return value?.trim().toLowerCase() || undefined;
}

function normalizeSymbol(value?: string | null): string | undefined {
  return value?.trim().toUpperCase() || undefined;
}

function shortenIdentifier(value?: string | null): string {
  if (!value) {
    return "UNKNOWN";
  }

  if (value.length <= 12) {
    return value;
  }

  return `${value.slice(0, 6)}...${value.slice(-4)}`;
}

function parseTokenPriceOverrides(): Record<string, TokenPriceOverride> {
  const raw = process.env.TOKEN_PRICE_OVERRIDES;

  if (!raw) {
    return {};
  }

  try {
    const parsed = JSON.parse(raw) as Record<string, TokenPriceOverride>;
    return Object.fromEntries(
      Object.entries(parsed).map(([key, value]) => [key.toLowerCase(), value]),
    );
  } catch (error) {
    console.error("Failed to parse TOKEN_PRICE_OVERRIDES:", error);
    return {};
  }
}

const tokenPriceOverrides = parseTokenPriceOverrides();

function resolveFromOverrides(input: AssetLookupInput): ResolvedAsset | null {
  const keys = [normalizeIdentifier(input.identifier), normalizeIdentifier(input.symbol)].filter(
    Boolean,
  ) as string[];

  for (const key of keys) {
    const override = tokenPriceOverrides[key];

    if (!override) {
      continue;
    }

    if (typeof override === "number") {
      return {
        symbol: normalizeSymbol(input.symbol) ?? shortenIdentifier(input.identifier),
        usdPrice: override,
      };
    }

    return {
      symbol: override.symbol?.toUpperCase() ?? normalizeSymbol(input.symbol) ?? shortenIdentifier(input.identifier),
      usdPrice: override.usdPrice,
    };
  }

  return null;
}

async function getCoinGeckoPrice(coinId: string): Promise<number | null> {
  const now = Date.now();
  const cached = priceCache.get(coinId);

  if (cached && cached.expiresAt > now) {
    return cached.value;
  }

  const url = new URL("https://api.coingecko.com/api/v3/simple/price");
  url.searchParams.set("ids", coinId);
  url.searchParams.set("vs_currencies", "usd");

  const response = await fetch(url.toString(), {
    method: "GET",
    cache: "no-store",
    signal: AbortSignal.timeout(2_000),
  });

  if (!response.ok) {
    return null;
  }

  const data = (await response.json()) as Record<string, { usd?: number }>;
  const price = data[coinId]?.usd;

  if (typeof price === "number") {
    priceCache.set(coinId, {
      expiresAt: now + 60_000,
      value: price,
    });

    return price;
  }

  return null;
}

export async function resolveAsset(input: AssetLookupInput): Promise<ResolvedAsset> {
  const symbol = normalizeSymbol(input.symbol);
  const overrideAsset = resolveFromOverrides(input);

  if (overrideAsset) {
    return overrideAsset;
  }

  if (symbol && STABLECOIN_PRICES[symbol] !== undefined) {
    return {
      symbol,
      usdPrice: STABLECOIN_PRICES[symbol],
    };
  }

  if (symbol && COINGECKO_IDS[symbol]) {
    return {
      symbol,
      usdPrice: await getCoinGeckoPrice(COINGECKO_IDS[symbol]),
    };
  }

  return {
    symbol: symbol ?? shortenIdentifier(input.identifier),
    usdPrice: null,
  };
}
