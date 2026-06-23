import { Resend } from 'resend';

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://828-grill.vercel.app';
const FROM = `828 Grill <${process.env.NEWSLETTER_FROM ?? 'noreply@828grill.com'}>`;

function shortId(id: string) { return id.slice(-8).toUpperCase(); }
function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(n);
}

export interface OrderEmailData {
  id: string;
  total: number;
  createdAt: string;
  userName: string;
  userEmail: string;
  items: { name: string; quantity: number; unitPrice: number }[];
}

export async function sendOrderConfirmationEmail(order: OrderEmailData) {
  if (!process.env.RESEND_API_KEY) return;

  const itemRows = order.items.map((i) =>
    `<tr>
      <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.06);color:#ccc;font-size:14px">${i.quantity}× ${i.name}</td>
      <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.06);text-align:right;color:#f5f0e8;font-size:14px;font-weight:600">${fmt(i.unitPrice * i.quantity)}</td>
    </tr>`
  ).join('');

  const resend = new Resend(process.env.RESEND_API_KEY);
  await resend.emails.send({
    from: FROM,
    to: order.userEmail,
    subject: `Order #${shortId(order.id)} confirmed — 828 Grill`,
    html: `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>Order confirmed</title></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:system-ui,sans-serif">
  <div style="max-width:520px;margin:0 auto;padding:48px 24px">
    <div style="text-align:center;margin-bottom:32px">
      <span style="color:#f5f0e8;font-size:22px;font-weight:800;letter-spacing:3px">828 <span style="color:#e8531a">GRILL</span></span>
    </div>
    <div style="background:#141414;border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:36px">
      <div style="text-align:center;margin-bottom:28px">
        <div style="display:inline-block;background:#e8531a20;border-radius:50%;width:56px;height:56px;line-height:56px;font-size:28px;margin-bottom:12px">🔥</div>
        <h1 style="margin:0 0 6px;color:#f5f0e8;font-size:22px;font-weight:800">Order Confirmed!</h1>
        <p style="margin:0;color:#888;font-size:14px">Hey ${order.userName || 'there'}, we got your order.</p>
      </div>
      <div style="background:#0d0d0d;border-radius:10px;padding:16px 20px;margin-bottom:24px">
        <div style="display:flex;justify-content:space-between;margin-bottom:6px">
          <span style="color:#888;font-size:12px;text-transform:uppercase;letter-spacing:1px">Order</span>
          <span style="color:#e8531a;font-size:12px;font-weight:700;letter-spacing:1px">#${shortId(order.id)}</span>
        </div>
        <div style="display:flex;justify-content:space-between">
          <span style="color:#888;font-size:12px;text-transform:uppercase;letter-spacing:1px">Pickup</span>
          <span style="color:#f5f0e8;font-size:12px;font-weight:600">Ready in ~20 min</span>
        </div>
      </div>
      <table style="width:100%;border-collapse:collapse;margin-bottom:16px">${itemRows}</table>
      <div style="border-top:2px solid rgba(255,255,255,0.1);padding-top:14px;display:flex;justify-content:space-between;align-items:center">
        <span style="color:#f5f0e8;font-size:14px;font-weight:700;text-transform:uppercase;letter-spacing:1px">Total</span>
        <span style="color:#e8531a;font-size:20px;font-weight:800">${fmt(order.total)}</span>
      </div>
      <div style="margin-top:28px;background:#1a1a1a;border-radius:10px;padding:16px 20px;text-align:center">
        <p style="margin:0 0 4px;color:#888;font-size:12px;text-transform:uppercase;letter-spacing:1px">Where to pick up</p>
        <p style="margin:0;color:#f5f0e8;font-size:14px;font-weight:600">828 Grill · Asheville, NC 28801</p>
      </div>
      <p style="margin:24px 0 0;color:#555;font-size:12px;text-align:center">
        Questions? Reply to this email or visit <a href="${SITE}" style="color:#e8531a">${SITE.replace('https://', '')}</a>
      </p>
    </div>
    <p style="margin:24px 0 0;text-align:center;color:#444;font-size:12px">828 Grill LLC · Asheville, NC 28801</p>
  </div>
</body></html>`,
  }).catch(() => {});
}

export async function sendAdminOrderNotificationEmail(order: OrderEmailData) {
  const adminEmail = process.env.RESTAURANT_EMAIL;
  if (!process.env.RESEND_API_KEY || !adminEmail) return;

  const itemList = order.items
    .map((i) => `${i.quantity}× ${i.name} (${fmt(i.unitPrice * i.quantity)})`)
    .join('\n');

  const itemRows = order.items.map((i) =>
    `<tr>
      <td style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.06);color:#ccc;font-size:14px">${i.quantity}× ${i.name}</td>
      <td style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.06);text-align:right;color:#f5f0e8;font-size:14px;font-weight:600">${fmt(i.unitPrice * i.quantity)}</td>
    </tr>`
  ).join('');

  const resend = new Resend(process.env.RESEND_API_KEY);
  await resend.emails.send({
    from: FROM,
    to: adminEmail,
    subject: `New order #${shortId(order.id)} — ${fmt(order.total)}`,
    text: `New order received!\n\nOrder: #${shortId(order.id)}\nCustomer: ${order.userName} <${order.userEmail}>\nTotal: ${fmt(order.total)}\n\nItems:\n${itemList}\n\nManage orders: ${SITE}/admin`,
    html: `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>New order</title></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:system-ui,sans-serif">
  <div style="max-width:520px;margin:0 auto;padding:48px 24px">
    <div style="text-align:center;margin-bottom:32px">
      <span style="color:#f5f0e8;font-size:22px;font-weight:800;letter-spacing:3px">828 <span style="color:#e8531a">GRILL</span></span>
    </div>
    <div style="background:#141414;border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:36px">
      <h1 style="margin:0 0 6px;color:#f5f0e8;font-size:20px;font-weight:800">New order received</h1>
      <p style="margin:0 0 24px;color:#e8531a;font-size:14px;font-weight:700">Order #${shortId(order.id)} · ${fmt(order.total)}</p>
      <div style="background:#0d0d0d;border-radius:10px;padding:14px 18px;margin-bottom:20px">
        <p style="margin:0 0 4px;color:#888;font-size:11px;text-transform:uppercase;letter-spacing:1px">Customer</p>
        <p style="margin:0;color:#f5f0e8;font-size:14px;font-weight:600">${order.userName}</p>
        <p style="margin:0;color:#888;font-size:13px">${order.userEmail}</p>
      </div>
      <table style="width:100%;border-collapse:collapse;margin-bottom:16px">${itemRows}</table>
      <div style="border-top:2px solid rgba(255,255,255,0.1);padding-top:14px;text-align:right">
        <span style="color:#e8531a;font-size:20px;font-weight:800">${fmt(order.total)}</span>
      </div>
      <div style="text-align:center;margin-top:28px">
        <a href="${SITE}/admin" style="display:inline-block;background:#e8531a;color:white;text-decoration:none;font-weight:700;font-size:13px;letter-spacing:1px;text-transform:uppercase;padding:12px 28px;border-radius:10px">
          Manage Orders
        </a>
      </div>
    </div>
  </div>
</body></html>`,
  }).catch(() => {});
}

export async function sendOrderStatusEmail(
  order: OrderEmailData,
  status: 'preparing' | 'ready' | 'delivered' | 'cancelled',
) {
  if (!process.env.RESEND_API_KEY) return;

  const resend = new Resend(process.env.RESEND_API_KEY);
  const id = shortId(order.id);
  const feedbackUrl = `${SITE}?orderId=${order.id}&feedback=1`;

  const configs = {
    preparing: {
      subject: `We're cooking your order #${id}! 🔥`,
      emoji: '👨‍🍳',
      headline: "We're on it!",
      body: `Your order is being prepared by our kitchen team right now. It should be ready in about 15–20 minutes.`,
      ctaLabel: null as string | null,
      ctaUrl: null as string | null,
      accentNote: 'Estimated ready time: ~20 min',
    },
    ready: {
      subject: `Order #${id} is ready! 🎉`,
      emoji: '✅',
      headline: 'Your order is ready!',
      body: `Hot and fresh — your order is ready. Come grab it at the counter whenever you're ready!`,
      ctaLabel: null,
      ctaUrl: null,
      accentNote: 'Ready for pickup at the counter',
    },
    delivered: {
      subject: `How was your 828 Grill experience? 🍔`,
      emoji: '❤️',
      headline: 'Hope you loved it!',
      body: `Thank you for choosing 828 Grill! We'd love to know what you thought — it only takes 10 seconds.`,
      ctaLabel: 'Leave a Quick Review',
      ctaUrl: feedbackUrl,
      accentNote: null,
    },
    cancelled: {
      subject: `Order #${id} was cancelled`,
      emoji: '❌',
      headline: 'Order Cancelled',
      body: `We're sorry — your order #${id} has been cancelled. If you were charged, you'll receive a full refund within 3–5 business days. Questions? Just reply to this email.`,
      ctaLabel: 'Order Again',
      ctaUrl: SITE,
      accentNote: null,
    },
  };

  const c = configs[status];
  const itemRows = order.items.map((i) =>
    `<tr>
      <td style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.06);color:#ccc;font-size:14px">${i.quantity}× ${i.name}</td>
      <td style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.06);text-align:right;color:#f5f0e8;font-size:14px;font-weight:600">${fmt(i.unitPrice * i.quantity)}</td>
    </tr>`
  ).join('');

  await resend.emails.send({
    from: FROM,
    to: order.userEmail,
    subject: c.subject,
    html: `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>${c.headline}</title></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:system-ui,sans-serif">
  <div style="max-width:520px;margin:0 auto;padding:48px 24px">
    <div style="text-align:center;margin-bottom:32px">
      <span style="color:#f5f0e8;font-size:22px;font-weight:800;letter-spacing:3px">828 <span style="color:#e8531a">GRILL</span></span>
    </div>
    <div style="background:#141414;border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:36px">
      <div style="text-align:center;margin-bottom:24px">
        <div style="font-size:40px;margin-bottom:12px">${c.emoji}</div>
        <h1 style="margin:0 0 8px;color:#f5f0e8;font-size:22px;font-weight:800">${c.headline}</h1>
        <p style="margin:0;color:#888;font-size:14px">Hey ${order.userName || 'there'} — Order <span style="color:#e8531a;font-weight:700">#${id}</span></p>
      </div>
      <p style="margin:0 0 24px;color:#aaa;font-size:15px;line-height:1.7;text-align:center">${c.body}</p>
      ${c.accentNote ? `<div style="background:#e8531a15;border:1px solid #e8531a30;border-radius:10px;padding:12px 16px;text-align:center;margin-bottom:24px">
        <p style="margin:0;color:#e8531a;font-size:14px;font-weight:600">${c.accentNote}</p>
      </div>` : ''}
      <table style="width:100%;border-collapse:collapse;margin-bottom:16px">${itemRows}</table>
      <div style="border-top:2px solid rgba(255,255,255,0.1);padding-top:14px;display:flex;justify-content:space-between;align-items:center;margin-bottom:${c.ctaUrl ? '28px' : '0'}">
        <span style="color:#f5f0e8;font-size:14px;font-weight:700;text-transform:uppercase;letter-spacing:1px">Total</span>
        <span style="color:#e8531a;font-size:20px;font-weight:800">${fmt(order.total)}</span>
      </div>
      ${c.ctaUrl ? `<div style="text-align:center">
        <a href="${c.ctaUrl}" style="display:inline-block;background:#e8531a;color:white;text-decoration:none;font-weight:700;font-size:13px;letter-spacing:1px;text-transform:uppercase;padding:12px 28px;border-radius:10px">${c.ctaLabel}</a>
      </div>` : ''}
    </div>
    <p style="margin:24px 0 0;text-align:center;color:#444;font-size:12px">828 Grill LLC · Asheville, NC 28801</p>
  </div>
</body></html>`,
  }).catch(() => {});
}

export async function sendVerificationEmail(email: string, name: string, token: string) {
  if (!process.env.RESEND_API_KEY) return;

  const verifyUrl = `${SITE}/api/auth/verify?token=${encodeURIComponent(token)}`;

  const resend = new Resend(process.env.RESEND_API_KEY);
  await resend.emails.send({
    from: FROM,
    to: email,
    subject: 'Verify your 828 Grill email',
    html: `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8">
<title>Verify your email</title></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:system-ui,sans-serif">
  <div style="max-width:520px;margin:0 auto;padding:48px 24px">
    <div style="text-align:center;margin-bottom:32px">
      <span style="color:#f5f0e8;font-size:22px;font-weight:800;letter-spacing:3px">828 <span style="color:#e8531a">GRILL</span></span>
    </div>
    <div style="background:#141414;border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:36px">
      <p style="margin:0 0 8px;color:#888;font-size:13px;text-transform:uppercase;letter-spacing:1px">Hey ${name || 'there'},</p>
      <h1 style="margin:0 0 20px;color:#f5f0e8;font-size:22px;font-weight:800">Verify your email address</h1>
      <p style="margin:0 0 28px;color:#aaa;font-size:15px;line-height:1.7">
        Click the button below to verify your email and complete your 828 Grill account.
        This link expires in 24 hours.
      </p>
      <div style="text-align:center">
        <a href="${verifyUrl}" style="display:inline-block;background:#e8531a;color:white;text-decoration:none;font-weight:700;font-size:14px;letter-spacing:1px;text-transform:uppercase;padding:14px 32px;border-radius:10px">
          Verify Email
        </a>
      </div>
      <p style="margin:24px 0 0;color:#555;font-size:12px;text-align:center">
        If you didn't create an account, you can safely ignore this email.
      </p>
    </div>
    <p style="margin:24px 0 0;text-align:center;color:#444;font-size:12px">
      828 Grill LLC · Asheville, NC 28801
    </p>
  </div>
</body></html>`,
  }).catch(() => { /* non-blocking */ });
}
