-- CreateEnum
CREATE TYPE "Role" AS ENUM ('OWNER', 'MEMBER');

-- CreateEnum
CREATE TYPE "Network" AS ENUM ('BITCOIN', 'SOLANA', 'ETHEREUM', 'BASE');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "role" "Role" NOT NULL DEFAULT 'MEMBER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Wallet" (
    "id" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "name" TEXT,
    "network" "Network" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "userId" TEXT,
    "chatId" TEXT,
    "alphaChannelId" TEXT,
    "lastBalance" DECIMAL(38,18) NOT NULL DEFAULT 0,
    "minAlertUsd" DOUBLE PRECISION DEFAULT 100,
    "winRate" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "totalTrades" INTEGER NOT NULL DEFAULT 0,
    "successTrades" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Wallet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TokenPosition" (
    "id" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "tokenAddress" TEXT NOT NULL,
    "tokenSymbol" TEXT,
    "tokenAmount" DECIMAL(38,18) NOT NULL DEFAULT 0,
    "totalInvestedUsd" DECIMAL(38,18) NOT NULL DEFAULT 0,
    "avgBuyPriceUsd" DECIMAL(38,18) NOT NULL DEFAULT 0,
    "realizedPnlUsd" DECIMAL(38,18) NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TokenPosition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "dedupeKey" TEXT NOT NULL,
    "signature" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" DECIMAL(38,18) NOT NULL,
    "tokenSymbol" TEXT NOT NULL,
    "tokenAddress" TEXT,
    "usdValue" DECIMAL(18,2) NOT NULL,
    "explorerUrl" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Wallet_network_isActive_idx" ON "Wallet"("network", "isActive");

-- CreateIndex
CREATE INDEX "Wallet_chatId_idx" ON "Wallet"("chatId");

-- CreateIndex
CREATE INDEX "Wallet_userId_idx" ON "Wallet"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Wallet_address_network_userId_key" ON "Wallet"("address", "network", "userId");

-- CreateIndex
CREATE INDEX "TokenPosition_walletId_idx" ON "TokenPosition"("walletId");

-- CreateIndex
CREATE UNIQUE INDEX "TokenPosition_walletId_tokenAddress_key" ON "TokenPosition"("walletId", "tokenAddress");

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_dedupeKey_key" ON "Transaction"("dedupeKey");

-- CreateIndex
CREATE INDEX "Transaction_walletId_createdAt_idx" ON "Transaction"("walletId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Transaction_signature_idx" ON "Transaction"("signature");

-- AddForeignKey
ALTER TABLE "Wallet" ADD CONSTRAINT "Wallet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TokenPosition" ADD CONSTRAINT "TokenPosition_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Wallet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Wallet"("id") ON DELETE CASCADE ON UPDATE CASCADE;
