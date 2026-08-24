/**
 * AEKR website Worker.
 *
 * The site itself is static and served straight from the assets binding. The
 * only dynamic route is POST /api/contact, which exists so the destination
 * mailbox never has to appear in anything the browser can see.
 *
 * Configuration (server-side only, never shipped to the client):
 *   CONTACT_RECIPIENT_EMAIL  where submissions are delivered
 *   CONTACT_SENDER_EMAIL     the From: address, on a domain onboarded to
 *                            Cloudflare Email Sending
 *   EMAIL                    send_email binding
 */

const MAX_EMAIL_LENGTH = 254;
const MAX_COMMENT_LENGTH = 4000;
const DEFAULT_SENDER = "website@aekr.io";

/**
 * Deliberately strict: no whitespace, no control characters, exactly one @.
 * Beyond validating shape, this is what makes the address safe to place in a
 * Reply-To header — there is no way to smuggle a newline through it.
 */
const EMAIL_PATTERN = /^[^\s@<>,;:"'\\]+@[^\s@<>,;:"'\\]+\.[a-z]{2,}$/i;

/**
 * Best-effort throttle. This lives in isolate memory, so it is not a durable
 * rate limiter — it exists to blunt trivial floods without adding storage
 * infrastructure to a static marketing site. The honeypot and the validation
 * below do the real work.
 */
const recentSubmissions = new Map();
const THROTTLE_WINDOW_MS = 60_000;
const THROTTLE_MAX = 5;

function isThrottled(key) {
  const now = Date.now();
  const hits = (recentSubmissions.get(key) || []).filter((t) => now - t < THROTTLE_WINDOW_MS);
  hits.push(now);
  recentSubmissions.set(key, hits);

  if (recentSubmissions.size > 5000) recentSubmissions.clear();
  return hits.length > THROTTLE_MAX;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function json(body, statusCode) {
  return new Response(JSON.stringify(body), {
    status: statusCode,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

function buildMessage({ email, comment, requestType, timestamp, meta }) {
  const isPricing = requestType === "pricing";
  const subject = isPricing
    ? "AEKR Website — Pricing by Tier Request"
    : "AEKR Website — Contact Request";

  const body = comment || "(no comment provided)";
  const rows = [
    ["Request type", isPricing ? "PRICING BY TIER" : "General contact"],
    ["From", email],
    ["Received", timestamp],
    ["Origin", meta.country ? `aekr.io (${meta.country})` : "aekr.io"],
  ];

  const text = [
    isPricing
      ? "A visitor requested the AEKR pricing by tier."
      : "A visitor sent a message from the AEKR website.",
    "",
    ...rows.map(([label, value]) => `${label}: ${value}`),
    "",
    "Comment:",
    body,
  ].join("\n");

  const html = [
    "<div style=\"font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;line-height:1.5;color:#111\">",
    `<p style="margin:0 0 16px"><strong>${
      isPricing
        ? "A visitor requested the AEKR pricing by tier."
        : "A visitor sent a message from the AEKR website."
    }</strong></p>`,
    "<table cellpadding=\"0\" cellspacing=\"0\" style=\"border-collapse:collapse;margin-bottom:20px\">",
    ...rows.map(
      ([label, value]) =>
        `<tr><td style="padding:4px 16px 4px 0;color:#555">${escapeHtml(label)}</td>` +
        `<td style="padding:4px 0"><strong>${escapeHtml(value)}</strong></td></tr>`
    ),
    "</table>",
    "<p style=\"margin:0 0 6px;color:#555\">Comment</p>",
    `<div style="white-space:pre-wrap;padding:12px 14px;background:#f5f6f8;border-radius:8px">${escapeHtml(
      body
    )}</div>`,
    "</div>",
  ].join("");

  return { subject, text, html };
}

async function handleContact(request, env) {
  if (request.method !== "POST") {
    return json({ ok: false, error: "method_not_allowed" }, 405);
  }

  const contentType = request.headers.get("Content-Type") || "";
  if (!contentType.includes("application/json")) {
    return json({ ok: false, error: "unsupported_media_type" }, 415);
  }

  let payload;
  try {
    payload = await request.json();
  } catch {
    return json({ ok: false, error: "invalid_body" }, 400);
  }

  const email = String(payload.email ?? "").trim().slice(0, MAX_EMAIL_LENGTH + 1);
  const comment = String(payload.comment ?? "").trim().slice(0, MAX_COMMENT_LENGTH);
  const company = String(payload.company ?? "").trim();
  const requestType = payload.requestType === "pricing" ? "pricing" : "contact";

  // Honeypot. Real visitors never see this field, so anything in it is a bot.
  // Answer as though it worked rather than telling the sender what tripped.
  if (company) {
    return json({ ok: true, requestType }, 202);
  }

  if (!email || email.length > MAX_EMAIL_LENGTH || !EMAIL_PATTERN.test(email)) {
    return json({ ok: false, error: "invalid_email" }, 400);
  }

  const clientKey =
    request.headers.get("CF-Connecting-IP") ||
    request.headers.get("X-Forwarded-For") ||
    "unknown";

  if (isThrottled(clientKey)) {
    return json({ ok: false, error: "rate_limited" }, 429);
  }

  const recipient = env.CONTACT_RECIPIENT_EMAIL;
  if (!recipient || !env.EMAIL) {
    // Nothing was delivered, so nothing gets reported as delivered.
    console.error(
      "contact: delivery not configured",
      JSON.stringify({ hasRecipient: Boolean(recipient), hasBinding: Boolean(env.EMAIL) })
    );
    return json({ ok: false, error: "delivery_unavailable" }, 503);
  }

  const { subject, text, html } = buildMessage({
    email,
    comment,
    requestType,
    timestamp: new Date().toISOString(),
    meta: { country: request.headers.get("CF-IPCountry") || "" },
  });

  try {
    await env.EMAIL.send({
      to: recipient,
      from: { email: env.CONTACT_SENDER_EMAIL || DEFAULT_SENDER, name: "AEKR Website" },
      replyTo: email,
      subject,
      text,
      html,
    });
  } catch (error) {
    console.error("contact: send failed", error && error.message);
    return json({ ok: false, error: "send_failed" }, 502);
  }

  return json({ ok: true, requestType }, 200);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/contact") {
      return handleContact(request, env);
    }

    return env.ASSETS.fetch(request);
  },
};
