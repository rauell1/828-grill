import Link from 'next/link';

export const metadata = {
  title: 'Terms of Service — 828 Grill',
  description: 'Terms and conditions for ordering from 828 Grill LLC online.',
};

const UPDATED = 'June 23, 2026';
const CONTACT_EMAIL = 'hello@828grill.com';

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#0D0D0D] text-[#F5F0E8]">
      {/* Header */}
      <div className="border-b border-white/5 bg-[#111]">
        <div className="mx-auto max-w-3xl px-6 py-8">
          <Link href="/" className="mb-6 inline-block font-display text-2xl text-[#F5F0E8] hover:text-[#E8531A]">
            828 <span className="text-[#E8531A]">GRILL</span>
          </Link>
          <h1 className="font-display text-5xl text-[#F5F0E8]">Terms of Service</h1>
          <p className="mt-2 font-mono text-sm text-[#666]">Last updated: {UPDATED}</p>
        </div>
      </div>

      {/* Content */}
      <article className="mx-auto max-w-3xl space-y-10 px-6 py-12 text-sm leading-7 text-[#B8B0A8]">

        <section>
          <p>
            Please read these Terms of Service (&ldquo;Terms&rdquo;) carefully before placing an order through the
            828 Grill website. By creating an account or placing an order, you agree to be bound by these
            Terms and our <Link href="/privacy" className="text-[#E8531A] underline">Privacy Policy</Link>.
          </p>
        </section>

        <Section title="1. About Us">
          <p>
            These Terms govern your use of the online ordering service operated by <strong>828 Grill LLC</strong>,
            located in Asheville, NC 28801, USA. You can reach us at{' '}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-[#E8531A] underline">{CONTACT_EMAIL}</a>.
          </p>
        </Section>

        <Section title="2. Ordering">
          <ul className="list-inside list-disc space-y-2">
            <li>
              <strong>Pickup only.</strong> All orders placed through this website are for in-store or
              curbside pickup. We do not currently offer delivery.
            </li>
            <li>
              <strong>Order confirmation.</strong> Your order is confirmed once you receive a confirmation
              message and your payment has been processed. We reserve the right to cancel any order due
              to item unavailability, pricing errors, or suspected fraud.
            </li>
            <li>
              <strong>Pricing.</strong> Prices are displayed in US Dollars. All prices are subject to
              change without notice. The price charged is the price displayed at the time of order
              confirmation.
            </li>
            <li>
              <strong>Minimum age.</strong> You must be at least 18 years old to create an account and
              place orders.
            </li>
            <li>
              <strong>Account accuracy.</strong> You are responsible for ensuring that contact information
              (name, phone number) is accurate so we can reach you if there is an issue with your order.
            </li>
          </ul>
        </Section>

        <Section title="3. Payment">
          <p>
            We accept major credit and debit cards via <strong>Stripe</strong>. By submitting a payment,
            you authorise us to charge your card for the total order amount including any applicable taxes.
            All payments are processed securely; we do not store card details on our servers.
          </p>
        </Section>

        <Section title="4. Cancellations &amp; Refunds">
          <ul className="list-inside list-disc space-y-2">
            <li>
              <strong>Before preparation begins.</strong> Orders may be cancelled for a full refund if
              cancelled before we begin preparing your food. Contact us immediately at{' '}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-[#E8531A] underline">{CONTACT_EMAIL}</a>.
            </li>
            <li>
              <strong>After preparation begins.</strong> Once food preparation has started, cancellations
              are at our discretion. Refunds may not be available for orders already prepared.
            </li>
            <li>
              <strong>Incorrect or missing items.</strong> If your order is incorrect or items are missing,
              please contact us within 1 hour of pickup. We will offer a credit or replacement at our
              discretion.
            </li>
            <li>
              <strong>Refund processing.</strong> Approved refunds are issued to the original payment
              method and may take 5–10 business days to appear on your statement.
            </li>
          </ul>
        </Section>

        <Section title="5. Allergen Disclosure">
          <div className="rounded border border-[#E8531A]/40 bg-[#E8531A]/8 p-4">
            <p className="mb-3 font-bold text-[#E8531A] uppercase tracking-wide text-xs">
              ⚠ Important Allergen Warning
            </p>
            <p className="mb-3">
              Our kitchen handles the following major food allergens as classified by the FDA Food
              Allergen Labeling and Consumer Protection Act (FALCPA) and the FASTER Act of 2021:
            </p>
            <ul className="grid grid-cols-2 gap-1 list-inside list-disc sm:grid-cols-3">
              {['Peanuts', 'Tree Nuts', 'Milk / Dairy', 'Eggs', 'Wheat / Gluten', 'Soy', 'Fish', 'Shellfish', 'Sesame'].map((a) => (
                <li key={a}>{a}</li>
              ))}
            </ul>
            <p className="mt-4">
              <strong>Cross-contamination risk:</strong> Our kitchen is not allergen-free. Menu items may
              come into contact with allergens during preparation even when those allergens are not listed
              as ingredients. We cannot guarantee that any item is free from a specific allergen.
            </p>
            <p className="mt-3">
              If you have a severe food allergy, please contact us directly at{' '}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-[#E8531A] underline">{CONTACT_EMAIL}</a>{' '}
              <strong>before ordering</strong> to discuss your needs. 828 Grill LLC is not liable for
              adverse reactions resulting from undisclosed allergies.
            </p>
          </div>
        </Section>

        <Section title="6. Acceptable Use">
          <p>You agree not to:</p>
          <ul className="mt-2 list-inside list-disc space-y-1">
            <li>Place fraudulent orders or use stolen payment credentials</li>
            <li>Create multiple accounts to abuse promotions</li>
            <li>Attempt to access administrative functionality without authorisation</li>
            <li>Use automated bots or scrapers on this site</li>
            <li>Upload illegal, offensive, or infringing content</li>
          </ul>
          <p className="mt-3">
            We reserve the right to suspend or terminate accounts that violate these Terms.
          </p>
        </Section>

        <Section title="7. Intellectual Property">
          <p>
            All content on this website — including text, images, logos, and software — is owned by or
            licensed to 828 Grill LLC. You may not reproduce, distribute, or create derivative works
            without our express written permission.
          </p>
        </Section>

        <Section title="8. Disclaimer of Warranties">
          <p>
            This website and online ordering service are provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo; without
            any warranties of any kind, express or implied, including but not limited to warranties of
            merchantability, fitness for a particular purpose, or non-infringement. We do not warrant that
            the service will be uninterrupted, error-free, or free of viruses or other harmful components.
          </p>
        </Section>

        <Section title="9. Limitation of Liability">
          <p>
            To the maximum extent permitted by applicable law, 828 Grill LLC shall not be liable for any
            indirect, incidental, special, consequential, or punitive damages arising out of or related to
            your use of this service, even if advised of the possibility of such damages. Our total
            liability to you for any claim shall not exceed the amount paid by you for the specific order
            giving rise to the claim.
          </p>
        </Section>

        <Section title="10. Governing Law &amp; Dispute Resolution">
          <p>
            These Terms are governed by the laws of the State of <strong>North Carolina</strong>, United
            States, without regard to its conflict of law provisions. Any dispute arising from these Terms
            shall be resolved in the state or federal courts located in Buncombe County, North Carolina,
            and you consent to the personal jurisdiction of those courts.
          </p>
        </Section>

        <Section title="11. Changes to These Terms">
          <p>
            We may revise these Terms at any time by updating this page. The &ldquo;Last updated&rdquo; date will
            reflect the most recent revision. Continued use of the service after changes constitutes
            your acceptance of the updated Terms.
          </p>
        </Section>

        <Section title="12. Contact">
          <p>
            Questions about these Terms? Contact us at:<br />
            828 Grill LLC · Asheville, NC 28801<br />
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-[#E8531A] underline">{CONTACT_EMAIL}</a>
          </p>
        </Section>

        <div className="border-t border-white/5 pt-8 text-xs text-[#555]">
          <Link href="/" className="text-[#E8531A] underline">← Back to 828 Grill</Link>
          <span className="mx-3">·</span>
          <Link href="/privacy" className="text-[#E8531A] underline">Privacy Policy</Link>
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
