// src/handlers/alertDispatcher.ts
/**
 * 👑 PREDATOR TRACKER - STANDAR ARSITEKTUR PABRIK ROBOT (MODUL 11)
 * PILAR 3: Handlers (Dispatcher Alert Terisolasi)
 */

import { ENV } from "@/config/env";
import {
  sendTelegramNotification,
  buildPredatorAlertMessage,
  buildInlineKeyboard,
  PredatorAlertPayload,
} from "@/lib/telegram";

export interface DispatchAlertOptions {
  payload: PredatorAlertPayload;
  targetChatId: string;
  alphaChannelId?: string;
  userMinAlertUsd?: number;
}

export async function dispatchWhaleAlert(
  options: DispatchAlertOptions,
): Promise<{
  sentToDm: boolean;
  sentToAlpha: boolean;
}> {
  const { payload, targetChatId, alphaChannelId, userMinAlertUsd } = options;
  const dmThreshold = userMinAlertUsd || ENV.ASISTEN_MIN_USD;
  const alphaThreshold = ENV.ALPHA_FEED_MIN_USD;

  let sentToDm = false;
  let sentToAlpha = false;

  const alertText = buildPredatorAlertMessage(payload);
  const keyboard = buildInlineKeyboard(
    payload.network,
    payload.tokenAddress,
    payload.txUrl,
  );

  // 1. Kirim ke Private DM jika nominal > $100 (atau user threshold)
  if (payload.usdValue > dmThreshold && targetChatId) {
    try {
      await sendTelegramNotification({
        chatId: targetChatId,
        text: alertText,
        replyMarkup: { inline_keyboard: keyboard },
      });
      sentToDm = true;
      console.log(
        `✅ [TELEGRAM DM SENT] ${payload.whaleName} $${payload.tokenSymbol} ($${payload.usdValue.toFixed(2)} > $${dmThreshold})`,
      );
    } catch (err: any) {
      console.error(
        `[ALERT HANDLER ERROR] Failed to send DM to ${targetChatId}:`,
        err.message,
      );
    }
  }

  // 2. Kirim ke Predator Alpha Feed Channel jika nominal > $1000
  const isAlphaFeedEligible = payload.usdValue > alphaThreshold;
  const effectiveAlphaChannel = alphaChannelId || ENV.TELEGRAM_ALPHA_CHANNEL_ID;

  if (
    isAlphaFeedEligible &&
    effectiveAlphaChannel &&
    effectiveAlphaChannel !== targetChatId
  ) {
    try {
      await sendTelegramNotification({
        chatId: effectiveAlphaChannel,
        text: alertText,
        replyMarkup: { inline_keyboard: keyboard },
      });
      sentToAlpha = true;
      console.log(
        `👑 [PREDATOR ALPHA FEED SENT] ${payload.whaleName} $${payload.tokenSymbol} ($${payload.usdValue.toFixed(2)} > $${alphaThreshold})`,
      );
    } catch (err: any) {
      console.error(
        `[ALERT HANDLER ERROR] Failed to forward to Alpha Channel:`,
        err.message,
      );
    }
  }

  return { sentToDm, sentToAlpha };
}
