import { Network } from "@prisma/client";

export type WebhookSource = "HELIUS" | "ALCHEMY";
export type WhaleAction = "BUY" | "SELL";

export type TransferCandidate = {
  source: WebhookSource;
  network: Network;
  signature: string;
  amount: number;
  symbol?: string | null;
  tokenIdentifier?: string | null;
  fromAddress?: string | null;
  toAddress?: string | null;
  explorerUrl: string;
  dedupeBase: string;
};

export type HeliusEnhancedTransaction = {
  signature?: string;
  nativeTransfers?: Array<{
    amount?: number;
    fromUserAccount?: string;
    toUserAccount?: string;
  }>;
  tokenTransfers?: Array<{
    tokenAmount?: number;
    mint?: string;
    symbol?: string;
    fromUserAccount?: string;
    toUserAccount?: string;
  }>;
};

export type AlchemyAddressActivityPayload = {
  id?: string;
  type?: string;
  event?: {
    network?: string;
    activity?: Array<{
      hash?: string;
      fromAddress?: string;
      toAddress?: string;
      value?: number;
      asset?: string;
      category?: string;
      rawContract?: {
        address?: string;
        rawValue?: string;
        decimals?: number;
      };
    }>;
  };
};
