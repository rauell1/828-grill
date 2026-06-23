import Link from 'next/link';

export const metadata = {
  title: 'Privacy Policy — 828 Grill',
  description: 'How 828 Grill LLC collects, uses, and protects your personal information.',
};

const UPDATED = 'June 23, 2026';
const CONTACT_EMAIL = 'privacy@828grill.com';
const SITE = 'https://828-grill.vercel.app';

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#0D0D0D] text-[#F5F0E8]">
      {/* Header */}
      <div className="border-b border-white/5 bg-[#111]">
        <div className="mx-auto max-w-3xl px-6 py-8">
          <Link href="/" className="mb-6 inline-block font-display text-2xl text-[#F5F0E8] hover:text-[#E8531A]">
            828 <span className="text-[#E8531A]">GRILL</span>
          </Link>
          <h1 className="font-display text-5xl text-[#F5F0E8]">Privacy Policy</h1>
          <p className="mt-2 font-mono text-sm text-[#666]">Last updated: {UPDATED}</p>
        </div>
      </div>

      {/* Content */}
      <article className="mx-auto max-w-3xl space-y-10 px-6 py-12 text-sm leading-7 text-[#B8B0A8]">

        <section>
          <p>
            828 Grill LLC (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;) respects your privacy and is committed to
            protecting your personal information. This Privacy Policy explains what data we collect when you
            use <a href={SITE} className="text-[#E8531A] underline">{SITE}</a>, how we use it, and your
            rights with respect to it.
          </p>
          <p className="mt-3">
            By placing an order or creating an account, you agree to the practices described here.
          </p>
        </section>

        <Section title="1. Information We Collect">
          <h3 className="mb-2 text-xs font-bold uppercase tracking-widest text-[#E8531A]">Account &amp; Order Data</h3>
          <ul className="list-inside list-disc space-y-1">
            <li>Full name</li>
            <li>Email address</li>
            <li>Phone number (optional)</li>
            <li>Delivery or pickup address (optional)</li>
            <li>Order history — items ordered, quantities, totals, timestamps</li>
            <li>Password (stored as a bcrypt hash; we never store your plaintext password)</li>
          </ul>

          <h3 className="mb-2 mt-6 text-xs font-bold uppercase tracking-widest text-[#E8531A]">Payment Data</h3>
          <p>
            Payment card details are collected and processed by <strong>Stripe, Inc.</strong> We never store
            card numbers, CVCs, or expiration dates on our servers. We receive only a payment confirmation
            reference from Stripe. Stripe&apos;s privacy practices are governed by the{' '}
            <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer" className="text-[#E8531A] underline">
              Stripe Privacy Policy
            </a>.
          </p>

          <h3 className="mb-2 mt-6 text-xs font-bold uppercase tracking-widest text-[#E8531A]">Usage &amp; Analytics Data</h3>
          <p>
            We use <strong>Vercel Analytics</strong> to collect anonymised page-view and performance data
            (page URL, referrer, browser type, country). No personally identifiable information is included
            in analytics events. Analytics are only collected after you provide cookie consent.
          </p>

          <h3 className="mb-2 mt-6 text-xs font-bold uppercase tracking-widest text-[#E8531A]">Newsletter</h3>
          <p>
            If you subscribe to our newsletter, we store your name and email address for the purpose of
            sending promotional emails. You can unsubscribe at any time via the link at the bottom of any
            email.
          </p>
        </Section>

        <Section title="2. How We Use Your Information">
          <ul className="list-inside list-disc space-y-1">
            <li>Process and fulfil your orders</li>
            <li>Send order confirmation and status notifications</li>
            <li>Respond to customer service enquiries</li>
            <li>Send marketing emails (only if you opted in; opt-out available at any time)</li>
            <li>Improve site performance and user experience via analytics</li>
            <li>Comply with legal obligations (e.g., tax records)</li>
          </ul>
          <p className="mt-3">We do not sell your personal information to any third party.</p>
        </Section>

        <Section title="3. Third-Party Services">
          <p>We share data with the following service providers solely as needed to operate the site:</p>
          <div className="mt-4 overflow-hidden rounded border border-white/5">
            <table className="w-full text-xs">
              <thead className="bg-white/5 text-left">
                <tr>
                  <th className="px-4 py-2 font-bold">Provider</th>
                  <th className="px-4 py-2 font-bold">Purpose</th>
                  <th className="px-4 py-2 font-bold">Data Shared</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {[
                  ['Stripe, Inc.', 'Payment processing', 'Card details, order total'],
                  ['Resend', 'Transactional &amp; newsletter email', 'Name, email address'],
                  ['Cloudinary', 'Menu image hosting', 'Uploaded images (admin only)'],
                  ['Neon (xata.io)', 'Database hosting', 'All account and order data'],
                  ['Vercel, Inc.', 'Hosting &amp; analytics', 'Anonymised page-view data'],
                ].map(([provider, purpose, data]) => (
                  <tr key={provider} className="hover:bg-white/2">
                    <td className="px-4 py-2 text-[#F5F0E8]">{provider}</td>
                    <td className="px-4 py-2" dangerouslySetInnerHTML={{ __html: purpose }} />
                    <td className="px-4 py-2" dangerouslySetInnerHTML={{ __html: data }} />
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3">
            Each provider is bound by their own privacy policies and, where applicable, a data processing
            agreement with us.
          </p>
        </Section>

        <Section title="4. Cookies &amp; Tracking">
          <p>
            We use a single session cookie (<code className="rounded bg-white/5 px-1 py-0.5 font-mono text-xs">828-session</code>)
            for authentication — this is strictly necessary for the site to function and does not require
            your consent. We also use Vercel Analytics for performance monitoring, which is only activated
            after you provide your consent via the cookie banner.
          </p>
          <p className="mt-3">
            You can withdraw cookie consent at any time by clearing your browser&apos;s local storage for this site.
          </p>
        </Section>

        <Section title="5. Data Retention">
          <ul className="list-inside list-disc space-y-1">
            <li>Order records are retained for 7 years for legal and tax compliance</li>
            <li>Account data is retained until you request deletion</li>
            <li>Newsletter subscriptions are retained until you unsubscribe</li>
            <li>Vercel Analytics data is anonymised and governed by Vercel&apos;s retention policy</li>
          </ul>
        </Section>

        <Section title="6. Your Rights">
          <p>Depending on your location, you may have the following rights:</p>
          <ul className="mt-3 list-inside list-disc space-y-1">
            <li><strong>Access</strong> — request a copy of the personal data we hold about you</li>
            <li><strong>Correction</strong> — request that inaccurate data be corrected</li>
            <li><strong>Deletion</strong> — request that your account and personal data be deleted</li>
            <li><strong>Portability</strong> — receive your data in a machine-readable format</li>
            <li><strong>Objection</strong> — object to processing based on legitimate interest</li>
            <li><strong>Opt-out (CCPA)</strong> — California residents may opt out of the sale of personal
              information (we do not sell personal information)</li>
          </ul>
          <p className="mt-3">
            To exercise any of these rights, email us at{' '}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-[#E8531A] underline">{CONTACT_EMAIL}</a>.
            We will respond within 30 days.
          </p>
        </Section>

        <Section title="7. Children's Privacy">
          <p>
            Our service is not directed to children under the age of 13. We do not knowingly collect
            personal information from children. If you believe we have inadvertently collected such data,
            please contact us and we will delete it promptly.
          </p>
        </Section>

        <Section title="8. Security">
          <p>
            We implement appropriate technical and organisational safeguards: passwords are hashed with
            bcrypt, all connections are encrypted with TLS, authentication tokens have a maximum age, and
            rate limiting is applied to login and registration endpoints. No method of transmission over
            the internet is 100% secure, and we cannot guarantee absolute security.
          </p>
        </Section>

        <Section title="9. Changes to This Policy">
          <p>
            We may update this Privacy Policy from time to time. The &ldquo;Last updated&rdquo; date at the top of
            this page reflects the most recent revision. Continued use of the site after changes constitutes
            acceptance of the updated policy.
          </p>
        </Section>

        <Section title="10. Contact Us">
          <p>
            828 Grill LLC<br />
            Asheville, NC 28801<br />
            Email: <a href={`mailto:${CONTACT_EMAIL}`} className="text-[#E8531A] underline">{CONTACT_EMAIL}</a>
          </p>
        </Section>

        <div className="border-t border-white/5 pt-8 text-xs text-[#555]">
          <Link href="/" className="text-[#E8531A] underline">← Back to 828 Grill</Link>
          <span className="mx-3">·</span>
          <Link href="/terms" className="text-[#E8531A] underline">Terms of Service</Link>
        </div>
      </article>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-4 font-display text-3xl text-[#F5F0E8]">{title}</h2>
      {children}
    </section>
  );
}
