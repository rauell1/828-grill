import { Resend } from 'resend';

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://828-grill.vercel.app';
const FROM = `828 Grill <${process.env.NEWSLETTER_FROM ?? 'noreply@828grill.com'}>`;

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
