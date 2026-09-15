"use client";

import { useCallback, useEffect, useState } from "react";
import { catalogApi } from "@/lib/api";
import { RARITIES } from "@/lib/constants";
import LoadingState from "@/components/LoadingState";
import ErrorState from "@/components/ErrorState";
import CardGrid from "@/components/CardGrid";

export default function BrowsePage() {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [setFilter, setSetFilter] = useState("");
  const [debouncedSet, setDebouncedSet] = useState("");
  const [rarityFilter, setRarityFilter] = useState("");

  // Debounce the free-text set filter so every keystroke doesn't fire a
  // request at catalog-service.
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSet(setFilter.trim()), 300);
    return () => clearTimeout(timer);
  }, [setFilter]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await catalogApi.listCards({
        set: debouncedSet || undefined,
        rarity: rarityFilter || undefined,
      });
      setCards(data);
    } catch (err) {
      setError(err.message || "Failed to load cards.");
    } finally {
      setLoading(false);
    }
  }, [debouncedSet, rarityFilter]);

  useEffect(() => {
    // Standard fetch-on-change effect (react.dev/learn/you-might-not-need-an-effect#fetching-data) -
    // load() sets loading/error state synchronously before the async request starts.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const hasFilters = Boolean(setFilter || rarityFilter);

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
      <h1 className="mb-6 text-2xl font-semibold">Browse cards</h1>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <input
          type="text"
          placeholder="Filter by set..."
          value={setFilter}
          onChange={(e) => setSetFilter(e.target.value)}
          className="rounded-md border border-black/10 px-3 py-2 text-sm dark:border-white/20 dark:bg-transparent"
        />
        <select
          value={rarityFilter}
          onChange={(e) => setRarityFilter(e.target.value)}
          className="rounded-md border border-black/10 px-3 py-2 text-sm dark:border-white/20 dark:bg-transparent"
        >
          <option value="">All rarities</option>
          {RARITIES.map((r) => (
            <option key={r} value={r}>
              {r.replace("_", " ")}
            </option>
          ))}
        </select>
        {hasFilters && (
          <button
            type="button"
            onClick={() => {
              setSetFilter("");
              setRarityFilter("");
            }}
            className="text-sm text-black/60 underline underline-offset-2 dark:text-white/60"
          >
            Clear filters
          </button>
        )}
      </div>

      {loading && <LoadingState label="Loading cards..." />}

      {!loading && error && (
        <ErrorState message={`Couldn't load cards: ${error}`} onRetry={load} />
      )}

      {!loading && !error && cards.length === 0 && (
        <p className="text-sm text-black/60 dark:text-white/60">
          No cards match these filters.
        </p>
      )}

      {!loading && !error && cards.length > 0 && <CardGrid cards={cards} />}
    </main>
  );
}
