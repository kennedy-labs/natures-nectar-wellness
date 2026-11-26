import { getWhatsAppUrl } from "@/config/env.client";
import { SITE_NAME, getAbsoluteUrl } from "@/config/site";
import {
  getDeliveryFeeSummary,
  getDeliveryMethodLabel,
  parseDeliveryNotesPin,
} from "@/features/orders/utils/order.utils";
import { formatKes } from "@/lib/format";
import { db } from "@/server/db/prisma";

export type OrderNotificationEvent =
  | "ORDER_PLACED"
  | "PAYMENT_VERIFIED"
  | "ORDER_CANCELLED";

type SendOrderNotificationsInput = {
  orderId: string;
  event: OrderNotificationEvent;
  transactionRef?: string | null;
  paidAmount?: number | null;
  cancelReason?: string | null;
};

type EmailSendResult = {
  sent: boolean;
  reason?: string;
};

const RESEND_ENDPOINT = "https://api.resend.com/emails";
const DEFAULT_SANDBOX_FROM = `${SITE_NAME} <onboarding@resend.dev>`;

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatDeliveryMethodLabel(method: string): string {
  return getDeliveryMethodLabel(method);
}

function formatPaymentMethodLabel(method: string | null | undefined): string {
  if (method === "MPESA_BUY_GOODS") return "M-Pesa";
  if (method === "CASH_ON_PICKUP") return "Cash on Pickup";
  if (method === "CASH_ON_DELIVERY") return "Cash on Delivery";
  if (method === "BANK_TRANSFER") return "Bank Transfer";
  return "Standard";
}

function parseRecipientEmails(raw?: string | null): string[] {
  if (!raw) return [];
  return raw
    .split(/[,\s;]+/)
    .map((entry) => entry.trim())
    .filter((entry) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(entry));
}

function getEmailConfig() {
  const apiKey = process.env.RESEND_API_KEY?.trim() ?? "";
  const alertRecipients = parseRecipientEmails(process.env.ORDER_ALERT_EMAIL);
  const from = process.env.EMAIL_FROM?.trim() || DEFAULT_SANDBOX_FROM;

  return {
    enabled: Boolean(apiKey),
    apiKey,
    from,
    alertRecipients,
  };
}

async function sendResendEmail(args: {
  apiKey: string;
  from: string;
  to: string[];
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
}): Promise<EmailSendResult> {
  if (args.to.length === 0) {
    return { sent: false, reason: "NO_RECIPIENTS" };
  }

  try {
    const response = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${args.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: args.from,
        to: args.to,
        subject: args.subject,
        html: args.html,
        text: args.text,
        ...(args.replyTo ? { reply_to: args.replyTo } : {}),
      }),
      signal: AbortSignal.timeout(5000),
      cache: "no-store",
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => "");
      console.error(
        `[OrderNotification] Resend HTTP ${response.status}: ${errorBody.slice(0, 240)}`
      );
      return { sent: false, reason: `HTTP_${response.status}` };
    }

    return { sent: true };
  } catch (error) {
    console.error("[OrderNotification] Failed to send email:", error);
    return { sent: false, reason: "REQUEST_FAILED" };
  }
}

export async function sendOrderNotifications(
  input: SendOrderNotificationsInput
): Promise<{ adminSent: boolean; customerSent: boolean }> {
  const cfg = getEmailConfig();
  if (!cfg.enabled) {
    return { adminSent: false, customerSent: false };
  }

  const order = await db.order.findUnique({
    where: { id: input.orderId },
    include: {
      items: true,
      payments: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!order) {
    return { adminSent: false, customerSent: false };
  }

  const verifiedPayment =
    order.payments.find((p) => p.status === "VERIFIED") ?? null;
  const effectiveTotal = order.totalAmount ?? order.subtotalAmount;
  const formattedTotal = formatKes(effectiveTotal);
  const deliveryLabel = formatDeliveryMethodLabel(order.deliveryMethod);
  const deliveryFeeLabel = getDeliveryFeeSummary(
    order.deliveryMethod,
    order.deliveryFee
  );
  const paymentLabel = formatPaymentMethodLabel(order.preferredPaymentMethod);
  const receiptRef =
    input.transactionRef?.trim() || verifiedPayment?.transactionRef || null;
  const { cleanNotes, mapUrl } = parseDeliveryNotesPin(order.deliveryNotes);
  const trackingUrl = getAbsoluteUrl(
    `/orders?order=${encodeURIComponent(order.orderNumber)}`
  );
  const adminUrl = getAbsoluteUrl("/admin");
  const whatsappSupportUrl = getWhatsAppUrl(
    `Hello ${SITE_NAME}, I am checking on order ${order.orderNumber}.`
  );

  const itemsText = order.items
    .map(
      (item) =>
        `- ${item.productName} x${item.quantity}: ${formatKes(item.lineTotal)}`
    )
    .join("\n");

  const itemsHtml = order.items
    .map(
      (item) => `
        <tr>
          <td style="padding:8px 0;border-bottom:1px solid #e6e2d8;color:#1b2a21;">
            ${escapeHtml(item.productName)} &times; ${item.quantity}
          </td>
          <td style="padding:8px 0;border-bottom:1px solid #e6e2d8;text-align:right;color:#1b2a21;font-variant-numeric:tabular-nums;">
            ${escapeHtml(formatKes(item.lineTotal))}
          </td>
        </tr>
      `
    )
    .join("");

  const isCancelledEvent = input.event === "ORDER_CANCELLED";
  const isPaidVerified =
    input.event === "PAYMENT_VERIFIED" || Boolean(verifiedPayment);
  const cleanCancelReason = input.cancelReason
    ? input.cancelReason.replace(/[\u0000-\u001F\u007F]/g, " ").trim().slice(0, 200)
    : null;

  const paymentSummaryText = isCancelledEvent
    ? verifiedPayment
      ? `Paid (${paymentLabel}${receiptRef ? ` - Ref: ${receiptRef}` : ""}) — Refund required`
      : `${paymentLabel} (No payment charged)`
    : isPaidVerified
      ? `Paid (${paymentLabel})${receiptRef ? ` - Ref: ${receiptRef}` : ""}`
      : `${paymentLabel} (Payment pending)`;

  const tasks: Array<Promise<{ target: "admin" | "customer"; sent: boolean }>> =
    [];

  if (cfg.alertRecipients.length > 0) {
    const adminSubject = isCancelledEvent
      ? `[${SITE_NAME}] Order Cancelled by Customer: ${order.orderNumber} (${formattedTotal})`
      : input.event === "PAYMENT_VERIFIED"
        ? `[${SITE_NAME}] Payment Verified: ${order.orderNumber} (${formattedTotal})`
        : `[${SITE_NAME}] New Order: ${order.orderNumber} (${formattedTotal})`;

    const adminText = [
      isCancelledEvent
        ? `Customer cancelled order ${order.orderNumber}. Stock has been restored automatically.`
        : input.event === "PAYMENT_VERIFIED"
          ? `Payment verified for order ${order.orderNumber}.`
          : `New order received: ${order.orderNumber}.`,
      isCancelledEvent && verifiedPayment
        ? "ACTION NEEDED: This order had a verified M-Pesa payment. Please coordinate a refund."
        : null,
      isCancelledEvent && cleanCancelReason
        ? `Reason: ${cleanCancelReason}`
        : null,
      "",
      `Customer: ${order.customerName}`,
      `Phone: ${order.customerPhone}`,
      order.customerEmail ? `Email: ${order.customerEmail}` : null,
      `Payment: ${paymentSummaryText}`,
      `Delivery: ${deliveryLabel} (${deliveryFeeLabel})`,
      order.deliveryLocation ? `Location: ${order.deliveryLocation}` : null,
      mapUrl ? `GPS Pin: ${mapUrl}` : null,
      cleanNotes ? `Delivery Notes: ${cleanNotes}` : null,
      order.customerNotes ? `Customer Notes: ${order.customerNotes}` : null,
      "",
      "Items:",
      itemsText,
      "",
      `Delivery fee: ${deliveryFeeLabel}`,
      `Total: ${formattedTotal}`,
      `Admin dashboard: ${adminUrl}`,
    ]
      .filter((line): line is string => line !== null)
      .join("\n");

    const adminHtml = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#f8f6f1;color:#1b2a21;">
        <p style="margin:0 0 6px;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:${isCancelledEvent ? "#9f1239" : "#21543d"};font-weight:700;">
          ${escapeHtml(SITE_NAME)} · Admin Alert
        </p>
        <h1 style="margin:0 0 16px;font-size:22px;color:#1b2a21;">
          ${
            isCancelledEvent
              ? `Order Cancelled: ${escapeHtml(order.orderNumber)}`
              : input.event === "PAYMENT_VERIFIED"
                ? `Payment Verified: ${escapeHtml(order.orderNumber)}`
                : `New Order: ${escapeHtml(order.orderNumber)}`
          }
        </h1>
        ${
          isCancelledEvent
            ? `<div style="background:#fff1f2;border:1px solid #fecdd3;border-radius:10px;padding:12px 16px;margin-bottom:16px;color:#881337;font-size:14px;">
                <strong>Cancelled by customer.</strong> Stock was restored automatically.${
                  verifiedPayment
                    ? " <strong>M-Pesa payment was verified — please process refund.</strong>"
                    : ""
                }${
                  cleanCancelReason
                    ? `<br/><span>Reason: ${escapeHtml(cleanCancelReason)}</span>`
                    : ""
                }
              </div>`
            : ""
        }
        <div style="background:#ffffff;border:1px solid #e6e2d8;border-radius:10px;padding:16px;margin-bottom:16px;">
          <p style="margin:0 0 6px;"><strong>Customer:</strong> ${escapeHtml(order.customerName)}</p>
          <p style="margin:0 0 6px;"><strong>Phone:</strong> ${escapeHtml(order.customerPhone)}</p>
          ${
            order.customerEmail
              ? `<p style="margin:0 0 6px;"><strong>Email:</strong> ${escapeHtml(order.customerEmail)}</p>`
              : ""
          }
          <p style="margin:0 0 6px;"><strong>Payment:</strong> ${escapeHtml(paymentSummaryText)}</p>
          <p style="margin:0 0 6px;"><strong>Delivery:</strong> ${escapeHtml(deliveryLabel)} (${escapeHtml(deliveryFeeLabel)})</p>
          ${
            order.deliveryLocation
              ? `<p style="margin:0 0 6px;"><strong>Location:</strong> ${escapeHtml(order.deliveryLocation)}</p>`
              : ""
          }
          ${
            mapUrl
              ? `<p style="margin:0 0 6px;"><strong>GPS Pin:</strong> <a href="${escapeHtml(mapUrl)}" style="color:#21543d;">Open in Google Maps</a></p>`
              : ""
          }
          ${
            cleanNotes
              ? `<p style="margin:0 0 6px;"><strong>Delivery Notes:</strong> ${escapeHtml(cleanNotes)}</p>`
              : ""
          }
          ${
            order.customerNotes
              ? `<p style="margin:0;"><strong>Customer Notes:</strong> ${escapeHtml(order.customerNotes)}</p>`
              : ""
          }
        </div>
        <div style="background:#ffffff;border:1px solid #e6e2d8;border-radius:10px;padding:16px;margin-bottom:20px;">
          <table style="width:100%;border-collapse:collapse;font-size:14px;">
            ${itemsHtml}
            <tr>
              <td style="padding:10px 0 4px;color:#5e6c63;">Delivery</td>
              <td style="padding:10px 0 4px;text-align:right;color:#5e6c63;">${escapeHtml(deliveryFeeLabel)}</td>
            </tr>
            <tr>
              <td style="padding:8px 0 0;font-weight:700;">Total</td>
              <td style="padding:8px 0 0;text-align:right;font-weight:700;">${escapeHtml(formattedTotal)}</td>
            </tr>
          </table>
        </div>
        <a href="${escapeHtml(adminUrl)}" style="display:inline-block;background:#21543d;color:#ffffff;text-decoration:none;padding:10px 18px;border-radius:8px;font-size:14px;font-weight:600;">
          Open Admin Dashboard
        </a>
      </div>
    `;

    tasks.push(
      sendResendEmail({
        apiKey: cfg.apiKey,
        from: cfg.from,
        to: cfg.alertRecipients,
        subject: adminSubject,
        html: adminHtml,
        text: adminText,
        replyTo: order.customerEmail?.trim() || undefined,
      }).then((res) => ({ target: "admin", sent: res.sent }))
    );
  }

  const customerEmails = parseRecipientEmails(order.customerEmail);
  if (customerEmails.length > 0) {
    const customerSubject = isCancelledEvent
      ? `Order ${order.orderNumber} cancelled – ${SITE_NAME}`
      : input.event === "PAYMENT_VERIFIED"
        ? `Payment confirmed for order ${order.orderNumber} – ${SITE_NAME}`
        : `Order ${order.orderNumber} received – ${SITE_NAME}`;

    const customerText = [
      `Hello ${order.customerName},`,
      "",
      isCancelledEvent
        ? verifiedPayment
          ? `Your order ${order.orderNumber} has been cancelled. Since your M-Pesa payment was verified, please message us on WhatsApp with your order number to coordinate your refund.`
          : `Your order ${order.orderNumber} has been cancelled as requested.`
        : input.event === "PAYMENT_VERIFIED"
          ? `Thank you for your payment. Your order ${order.orderNumber} is confirmed and queued for preparation.`
          : `Thank you for ordering from ${SITE_NAME}. We have received order ${order.orderNumber}.`,
      "",
      `Payment: ${paymentSummaryText}`,
      `Delivery: ${deliveryLabel} (${deliveryFeeLabel})`,
      order.deliveryLocation ? `Location: ${order.deliveryLocation}` : null,
      "",
      "Order summary:",
      itemsText,
      "",
      `Delivery fee: ${deliveryFeeLabel}`,
      `Total: ${formattedTotal}`,
      "",
      `Track your order on any device: ${trackingUrl}`,
      `When prompted on another phone or browser, enter your order number (${order.orderNumber}) and phone number (${order.customerPhone}).`,
      whatsappSupportUrl ? `Need help? WhatsApp: ${whatsappSupportUrl}` : null,
    ]
      .filter((line): line is string => line !== null)
      .join("\n");

    const customerHtml = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#f8f6f1;color:#1b2a21;">
        <p style="margin:0 0 6px;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#21543d;font-weight:700;">
          ${escapeHtml(SITE_NAME)}
        </p>
        <h1 style="margin:0 0 10px;font-size:22px;color:#1b2a21;">
          ${
            isCancelledEvent
              ? "Order cancelled"
              : input.event === "PAYMENT_VERIFIED"
                ? "Payment confirmed"
                : "Thank you for your order"
          }
        </h1>
        <p style="margin:0 0 18px;font-size:15px;line-height:1.5;color:#4a5a50;">
          Hello ${escapeHtml(order.customerName)}, ${
            isCancelledEvent
              ? verifiedPayment
                ? `your order <strong>${escapeHtml(order.orderNumber)}</strong> has been cancelled. Because your M-Pesa payment was verified, please message us on WhatsApp with your order number so we can arrange your refund.`
                : `your order <strong>${escapeHtml(order.orderNumber)}</strong> has been cancelled as requested.`
              : input.event === "PAYMENT_VERIFIED"
                ? `your payment for order <strong>${escapeHtml(order.orderNumber)}</strong> has been verified.`
                : `we have received your order <strong>${escapeHtml(order.orderNumber)}</strong>.`
          }
        </p>
        <div style="background:#ffffff;border:1px solid #e6e2d8;border-radius:10px;padding:16px;margin-bottom:16px;">
          <p style="margin:0 0 6px;"><strong>Order number:</strong> ${escapeHtml(order.orderNumber)}</p>
          <p style="margin:0 0 6px;"><strong>Payment:</strong> ${escapeHtml(paymentSummaryText)}</p>
          <p style="margin:0;"><strong>Delivery:</strong> ${escapeHtml(deliveryLabel)} (${escapeHtml(deliveryFeeLabel)})${
            order.deliveryLocation
              ? ` · ${escapeHtml(order.deliveryLocation)}`
              : ""
          }</p>
        </div>
        <div style="background:#ffffff;border:1px solid #e6e2d8;border-radius:10px;padding:16px;margin-bottom:20px;">
          <table style="width:100%;border-collapse:collapse;font-size:14px;">
            ${itemsHtml}
            <tr>
              <td style="padding:10px 0 4px;color:#5e6c63;">Delivery</td>
              <td style="padding:10px 0 4px;text-align:right;color:#5e6c63;">${escapeHtml(deliveryFeeLabel)}</td>
            </tr>
            <tr>
              <td style="padding:8px 0 0;font-weight:700;">Order total</td>
              <td style="padding:8px 0 0;text-align:right;font-weight:700;">${escapeHtml(formattedTotal)}</td>
            </tr>
          </table>
        </div>
        <a href="${escapeHtml(trackingUrl)}" style="display:inline-block;background:#21543d;color:#ffffff;text-decoration:none;padding:11px 20px;border-radius:8px;font-size:14px;font-weight:600;">
          View your order
        </a>
        <p style="margin:14px 0 0;font-size:12px;line-height:1.5;color:#5e6c63;">
          Opening this link on another device? Enter order number <strong>${escapeHtml(order.orderNumber)}</strong> and the phone number used at checkout to view live status.
        </p>
        ${
          whatsappSupportUrl
            ? `<p style="margin:10px 0 0;font-size:12px;color:#5e6c63;">Questions? <a href="${escapeHtml(whatsappSupportUrl)}" style="color:#21543d;">Message us on WhatsApp</a>.</p>`
            : ""
        }
      </div>
    `;

    tasks.push(
      sendResendEmail({
        apiKey: cfg.apiKey,
        from: cfg.from,
        to: customerEmails,
        subject: customerSubject,
        html: customerHtml,
        text: customerText,
      }).then((res) => ({ target: "customer", sent: res.sent }))
    );
  }

  const results = await Promise.all(tasks);
  return {
    adminSent: results.some((r) => r.target === "admin" && r.sent),
    customerSent: results.some((r) => r.target === "customer" && r.sent),
  };
}
