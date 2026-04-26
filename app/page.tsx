import Link from "next/link";
import { USER_CATEGORIES } from "@/lib/cpi/categories";
import { getSnapshot } from "@/lib/cpi/snapshot";
import Calculator from "@/components/Calculator";

export default function Page() {
  const snapshot = getSnapshot();
  const categories = USER_CATEGORIES.map((c) => ({
    key: c.key,
    label: c.label,
    description: c.description,
  }));

  return (
    <main className="mx-auto max-w-6xl px-5 py-10 md:py-14">
      <header className="mb-10 text-center">
        <div className="mx-auto mb-4 inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/50 px-3 py-1 text-xs font-medium uppercase tracking-wider text-zinc-400 backdrop-blur-sm">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
          </span>
          India · CPI base {snapshot.base_year}=100 · {formatMonth(snapshot.as_of_month)}
        </div>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight text-white md:text-5xl lg:text-6xl">
          Personal Inflation Calculator
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-zinc-400">
          Official CPI reflects an average household. Yours probably doesn&apos;t.
          Tell us about your lifestyle and we&apos;ll estimate the inflation <em>you</em> actually face.
        </p>
      </header>

      <Calculator categories={categories} />

      <section className="mt-12 rounded-2xl border border-zinc-800 bg-zinc-900/20 p-6 text-sm text-zinc-400">
        <h2 className="mb-3 text-base font-semibold text-zinc-200">How the magic works</h2>
        <ol className="space-y-2 pl-5 list-decimal marker:text-zinc-600">
          <li>
            We load official CPI subgroup indices (MoSPI, base {snapshot.base_year}=100).
          </li>
          <li>
            For each subgroup we compute year-over-year inflation from the index
            ratio: <code className="rounded bg-zinc-800 px-1.5 py-0.5 text-zinc-300">idx / idx_prev_year − 1</code>.
          </li>
          <li>
            Your rupee spending becomes your personal weights. We map each bucket
            to one or more CPI subgroups.
          </li>
          <li>
            Personal inflation = Σ (your weight × category inflation). The official
            headline on the same data is shown for comparison.
          </li>
        </ol>
      </section>

      <footer className="mt-12 border-t border-zinc-800 pt-8 pb-10 text-center text-xs text-zinc-500">
        <p>
          Source: {snapshot.source}. Series: {snapshot.series_id}. As of{" "}
          {formatMonth(snapshot.as_of_month)}.
        </p>
        <p className="mt-2 italic opacity-75">{snapshot.provenance_note}</p>
        <p className="mt-4">
          <Link
            href="/methodology"
            className="inline-flex items-center gap-1 font-medium text-zinc-400 underline decoration-zinc-700 underline-offset-4 transition-colors hover:text-white"
          >
            Read the full methodology
          </Link>
        </p>
      </footer>
    </main>
  );
}

function formatMonth(m: string): string {
  const [y, mm] = m.split("-");
  const d = new Date(Number(y), Number(mm) - 1, 1);
  return d.toLocaleString("en-IN", { month: "long", year: "numeric" });
}
