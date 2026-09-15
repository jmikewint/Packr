"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { catalogApi, pricingApi } from "@/lib/api";
import LoadingState from "@/components/LoadingState";
import ErrorState from "@/components/ErrorState";

function formatPrice(value, currency = "USD") {
  const n = typeof value === "string" ? Number(value) : value;
  if (Number.isNaN(n)) return String(value);
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(n);
}

export default function CardDetailPage() {
  const { id } = useParams();

  const [card, setCard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [estimate, setEstimate] = useState(null);
  const [estimateLoading, setEstimateLoading] = useState(false);
  const [estimateError, setEstimateError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    // Standard fetch-on-mount effect (react.dev/learn/you-might-not-need-an-effect#fetching-data) -
    // reset loading/error synchronously before the async request starts.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setError(null);
    catalogApi
      .getCard(id)
      .then((data) => {
        if (!cancelled) setCard(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || "Failed to load card.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  async function handleEstimate() {
    if (!card) return;
    setEstimateLoading(true);
    setEstimateError(null);
    setEstimate(null);
    try {
      const result = await pricingApi.estimate({
        name: card.name,
        set: card.set,
        rarity: card.rarity,
        condition: card.condition,
      });
      setEstimate(result);
    } catch (err) {
      setEstimateError(err.message || "Failed to get a price estimate.");
    } finally {
      setEstimateLoading(false);
    }
  }

  if (loading) {
    return (
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
        <LoadingState label="Loading card..." />
      </main>
    );
  }

  if (error) {
    return (
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
        <ErrorState message={`Couldn't load this card: ${error}`} />
      </main>
    );
  }

  if (!card) return null;

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
      <div className="flex flex-col gap-8 sm:flex-row">
        <div className="aspect-[3/4] w-full max-w-xs shrink-0 overflow-hidden rounded-lg bg-black/5 dark:bg-white/5">
          {card.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={card.imageUrl} alt={card.name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-black/40 dark:text-white/40">
              No image
            </div>
          )}
        </div>

        <div className="flex flex-1 flex-col gap-3">
          <h1 className="text-2xl font-semibold">{card.name}</h1>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <dt className="text-black/60 dark:text-white/60">Set</dt>
            <dd>{card.set}</dd>
            <dt className="text-black/60 dark:text-white/60">Rarity</dt>
            <dd>{card.rarity.replace("_", " ")}</dd>
            <dt className="text-black/60 dark:text-white/60">Condition</dt>
            <dd>{card.condition.replace("_", " ")}</dd>
            <dt className="text-black/60 dark:text-white/60">Listed price</dt>
            <dd className="font-semibold">{formatPrice(card.price)}</dd>
          </dl>

          <div className="mt-4">
            <button
              type="button"
              onClick={handleEstimate}
              disabled={estimateLoading}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {estimateLoading ? "Estimating..." : "Get AI Price Estimate"}
            </button>

            {estimateLoading && (
              <div className="mt-4">
                <LoadingState label="Asking Claude for a market estimate - this can take a few seconds..." />
              </div>
            )}

            {estimateError && !estimateLoading && (
              <div className="mt-4">
                <ErrorState
                  message={`Couldn't get a price estimate: ${estimateError}`}
                  onRetry={handleEstimate}
                />
              </div>
            )}

            {estimate && !estimateLoading && (
              <div className="mt-4 flex flex-col gap-3 rounded-lg border border-black/10 p-4 dark:border-white/10">
                <div className="text-lg font-semibold">
                  {formatPrice(estimate.priceEstimate.low, estimate.priceEstimate.currency)} &ndash;{" "}
                  {formatPrice(estimate.priceEstimate.high, estimate.priceEstimate.currency)}
                </div>
                <p className="text-sm text-black/70 dark:text-white/70">{estimate.reasoning}</p>
                {estimate.similarCards?.length > 0 && (
                  <div>
                    <h3 className="mb-2 text-sm font-medium">You might also like</h3>
                    <ul className="flex flex-col gap-2">
                      {estimate.similarCards.map((sc, i) => (
                        <li key={`${sc.name}-${i}`} className="text-sm">
                          <span className="font-medium">{sc.name}</span>{" "}
                          <span className="text-black/60 dark:text-white/60">({sc.set})</span>
                          <p className="text-black/60 dark:text-white/60">{sc.reason}</p>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
