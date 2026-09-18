import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy | Pulak Jain",
  description:
    "How anonymous portfolio analytics work: what is collected, what is not, and retention.",
};

const ROWS: Array<[string, string]> = [
  [
    "What is collected",
    "Anonymous engagement timings: which sections were viewed and for how long, which project and case-study cards were viewed, and which contact buttons were clicked — plus the share channel you arrived from (?ref= link, if any), device class, and landing page.",
  ],
  [
    "What is never collected",
    "No names, emails, or account data. No IP addresses — they are never written to the database. No cookies or localStorage identifiers: your visit lives in memory only and a reload starts a fresh anonymous session. No fingerprinting, no cross-site tracking, no third-party analytics scripts.",
  ],
  [
    "Do Not Track",
    "If your browser sends Do Not Track, all measurement disables itself entirely.",
  ],
  [
    "Retention",
    "Raw visit data is deleted after 13 months (sessions cascade to their events in a single monthly statement). There is nothing to export because nothing identifies you.",
  ],
  [
    "Your options",
    "Use an ad-blocker or Do Not Track to opt out completely — the site works identically either way. If you believe a record relates to you anyway, email and describe the visit; without identifiers there is nothing to look up, and that limitation is deliberate.",
  ],
];

export default function PrivacyPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-24">
      <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
        Privacy note
      </p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight">
        Analytics without identity
      </h1>
      <p className="mt-3 leading-relaxed text-muted-foreground">
        This portfolio measures anonymous engagement so its owner knows which
        work gets read. It is designed so that the data <em>cannot</em>{" "}
        identify you — not as a policy layered on top, but as a property of
        what is (and isn&apos;t) stored.
      </p>
      <dl className="mt-10 space-y-6">
        {ROWS.map(([term, body]) => (
          <div
            key={term}
            className="rounded-2xl border border-border bg-card p-6"
          >
            <dt className="font-mono text-xs font-semibold uppercase tracking-widest">
              {term}
            </dt>
            <dd className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {body}
            </dd>
          </div>
        ))}
      </dl>
      <p className="mt-10 font-mono text-xs text-muted-foreground">
        <a href="/" className="text-primary hover:underline">
          ← Back to the portfolio
        </a>
      </p>
    </main>
  );
}
