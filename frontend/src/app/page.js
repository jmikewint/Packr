import Link from "next/link";

export default function HomePage() {
  return (
    <main className="mx-auto flex max-w-3xl flex-1 flex-col items-center justify-center gap-6 px-4 py-24 text-center">
      <h1 className="text-4xl font-bold">Packr</h1>
      <p className="max-w-xl text-black/60 dark:text-white/60">
        A trading-card marketplace demo. Browse the catalog, get AI-backed price
        estimates, and list your own cards.
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <Link
          href="/browse"
          className="rounded-md bg-blue-600 px-5 py-2.5 text-white hover:bg-blue-700"
        >
          Browse cards
        </Link>
        <Link
          href="/signup"
          className="rounded-md border border-black/10 px-5 py-2.5 hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10"
        >
          Sign up
        </Link>
      </div>
    </main>
  );
}
