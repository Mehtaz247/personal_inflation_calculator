import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Methodology — Personal Inflation Calculator",
  description:
    "How the Personal Inflation Calculator reweights India's CPI to estimate your household inflation.",
};

export default function MethodologyPage() {
  return (
    <main className="mx-auto max-w-3xl px-5 py-10 md:py-14">
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-1 text-xs font-medium text-ink-500 hover:text-ink-800"
      >
        ← Back to calculator
      </Link>

      <h1 className="mb-6 text-3xl font-semibold tracking-tight text-ink-900 md:text-4xl">
        Methodology
      </h1>

      <div className="prose prose-sm max-w-none text-ink-700 [&_h2]:mt-8 [&_h2]:mb-3 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-ink-900 [&_h3]:mt-5 [&_h3]:mb-2 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-ink-800 [&_p]:mb-3 [&_p]:leading-relaxed [&_ul]:mb-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:mb-3 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:mb-1 [&_code]:rounded [&_code]:bg-ink-50 [&_code]:px-1 [&_code]:text-sm [&_code]:text-ink-800">
        <h2>What this calculator does</h2>
        <p>
          India&apos;s Consumer Price Index (CPI) measures the average change
          in prices paid by a representative household. But your household
          is not average. You may spend far more on healthcare and far less
          on tobacco than the national basket assumes.
        </p>
        <p>
          This tool lets you enter your own monthly spending across eleven
          consumption categories. It then replaces the national CPI weights
          with your personal weights and recomputes year-over-year inflation
          using the same official sub-group price indices released by the
          Ministry of Statistics and Programme Implementation (MoSPI).
        </p>

        <h2>The formula — Laspeyres-style reweighting</h2>
        <p>
          We use a Laspeyres-type fixed-basket approach, which is the same
          conceptual framework underlying the official CPI:
        </p>
        <p>
          <code>
            Personal Inflation = Σ (wᵢ × πᵢ)
          </code>
        </p>
        <p>where:</p>
        <ul>
          <li>
            <strong>wᵢ</strong> = your spending on category <em>i</em>{" "}
            divided by your total spending (your personal weight),
          </li>
          <li>
            <strong>πᵢ</strong> = year-over-year inflation for category{" "}
            <em>i</em>, computed as{" "}
            <code>Index(month) / Index(month − 12) − 1</code>.
          </li>
        </ul>
        <p>
          Each user-facing category maps to one or more official CPI
          sub-groups. When a category maps to multiple sub-groups (e.g.
          &ldquo;Household &amp; personal care&rdquo; combines Furnishings
          and Personal care), we weight the sub-groups by their national
          basket weights within that bucket.
        </p>

        <h2>Base year and the 2012 → 2024 transition</h2>
        <p>
          India&apos;s CPI was historically computed on base year 2012=100.
          In 2024, MoSPI transitioned to a new base (2024=100) aligned with
          the COICOP 2018 classification. This calculator uses the{" "}
          <strong>2024-base series</strong>, which includes twelve revised
          sub-group classifications:
        </p>
        <ol>
          <li>Food and beverages</li>
          <li>Pan, tobacco and intoxicants</li>
          <li>Clothing and footwear</li>
          <li>Housing and utilities</li>
          <li>Furnishings and household maintenance</li>
          <li>Health</li>
          <li>Transport</li>
          <li>Information and communication</li>
          <li>Recreation and culture</li>
          <li>Education services</li>
          <li>Restaurants and accommodation</li>
          <li>Personal care and miscellaneous</li>
        </ol>
        <p>
          Earlier bases grouped some of these differently (e.g. the old
          &ldquo;Miscellaneous&rdquo; bucket combined transport, health,
          education, and personal care). The COICOP 2018 alignment provides
          cleaner, more comparable categories.
        </p>

        <h2>Exclusions</h2>
        <p>
          Like the official CPI, this calculator measures <em>consumer
          price inflation</em> only. The following are excluded:
        </p>
        <ul>
          <li>Savings and investments (FDs, mutual funds, stocks, gold as investment)</li>
          <li>Asset prices (real estate purchase price, stock market values)</li>
          <li>Loan EMIs (only the interest component is captured through imputed rent)</li>
          <li>Income tax and other direct taxes</li>
        </ul>

        <h2>Sector definitions</h2>
        <p>
          MoSPI publishes separate CPI indices for three population
          segments. This tool lets you choose which one to use:
        </p>
        <ul>
          <li>
            <strong>Combined</strong> — the all-India index covering both
            urban and rural areas. This is the headline CPI used for
            monetary-policy targeting by the RBI.
          </li>
          <li>
            <strong>Urban</strong> — covers urban areas only. The basket
            weights give higher importance to housing and services.
          </li>
          <li>
            <strong>Rural</strong> — covers rural areas only. Food carries a
            larger weight in this basket.
          </li>
        </ul>

        <h2>Gap decomposition</h2>
        <p>
          The &ldquo;gap&rdquo; is defined as your personal inflation minus
          the official weighted-average inflation (both computed from the
          same sub-group indices). We decompose this gap as:
        </p>
        <p>
          <code>
            Gap ≈ Σ (wᵢ − Wᵢ) × πᵢ
          </code>
        </p>
        <p>
          where <code>Wᵢ</code> is the national basket weight for category{" "}
          <em>i</em>. Categories where you over-spend relative to the
          national basket and where prices rose faster will push your
          personal inflation above the headline number.
        </p>

        <h2>Limitations</h2>
        <ul>
          <li>
            <strong>Fixed basket:</strong> We hold your spending proportions
            constant. In reality, consumers substitute away from
            expensive goods (substitution bias).
          </li>
          <li>
            <strong>No quality adjustment:</strong> If you upgrade from a
            basic phone to a smartphone, the price increase partly reflects
            improved quality — this is not separated out.
          </li>
          <li>
            <strong>Sub-group granularity:</strong> MoSPI publishes twelve
            sub-groups, not hundreds of individual items. Two households
            within the same sub-group may experience different price changes.
          </li>
          <li>
            <strong>Recall accuracy:</strong> Spending estimates are only as
            good as your recall. Off-by-a-factor errors in a single category
            can meaningfully change results.
          </li>
          <li>
            <strong>Snapshot data:</strong> The index data is a static
            snapshot. It is refreshed periodically but may lag the latest
            MoSPI release by a few weeks.
          </li>
        </ul>

        <h2>Sources</h2>
        <ul>
          <li>
            Ministry of Statistics and Programme Implementation (MoSPI),
            Government of India —{" "}
            <a
              href="https://www.mospi.gov.in"
              target="_blank"
              rel="noopener noreferrer"
              className="text-ink-600 underline hover:text-ink-900"
            >
              mospi.gov.in
            </a>
          </li>
          <li>
            National Statistical Office (NSO) — Consumer Price Index
            (base 2024=100) monthly releases
          </li>
          <li>
            COICOP 2018 — Classification of Individual Consumption According
            to Purpose, United Nations
          </li>
        </ul>
      </div>

      <div className="mt-10 border-t border-ink-200 pt-5">
        <Link
          href="/"
          className="text-sm font-medium text-ink-600 hover:text-ink-900"
        >
          ← Back to calculator
        </Link>
      </div>
    </main>
  );
}
