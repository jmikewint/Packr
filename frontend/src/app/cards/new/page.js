"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { catalogApi } from "@/lib/api";
import { RARITIES, CONDITIONS } from "@/lib/constants";
import ErrorState from "@/components/ErrorState";
import LoadingState from "@/components/LoadingState";

const emptyForm = {
  name: "",
  set: "",
  rarity: RARITIES[0],
  condition: CONDITIONS[0],
  price: "",
  imageUrl: "",
};

export default function NewCardPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const card = await catalogApi.createCard({
        name: form.name,
        set: form.set,
        rarity: form.rarity,
        condition: form.condition,
        price: Number(form.price),
        ...(form.imageUrl ? { imageUrl: form.imageUrl } : {}),
      });
      router.push(`/cards/${card.id}`);
    } catch (err) {
      setError(err.message || "Failed to add card.");
    } finally {
      setSubmitting(false);
    }
  }

  if (authLoading) {
    return (
      <main className="mx-auto w-full max-w-lg flex-1 px-4 py-8">
        <LoadingState />
      </main>
    );
  }

  if (!isAuthenticated) {
    return (
      <main className="mx-auto w-full max-w-lg flex-1 px-4 py-8">
        <h1 className="mb-4 text-2xl font-semibold">Add a card</h1>
        <p className="text-sm text-black/60 dark:text-white/60">
          You need to be logged in to add a card.{" "}
          <Link href="/login" className="underline">
            Log in
          </Link>{" "}
          or{" "}
          <Link href="/signup" className="underline">
            sign up
          </Link>
          .
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-lg flex-1 px-4 py-8">
      <h1 className="mb-6 text-2xl font-semibold">Add a card</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm">
          Name
          <input
            required
            value={form.name}
            onChange={update("name")}
            className="rounded-md border border-black/10 px-3 py-2 dark:border-white/20 dark:bg-transparent"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Set
          <input
            required
            value={form.set}
            onChange={update("set")}
            className="rounded-md border border-black/10 px-3 py-2 dark:border-white/20 dark:bg-transparent"
          />
        </label>
        <div className="grid grid-cols-2 gap-4">
          <label className="flex flex-col gap-1 text-sm">
            Rarity
            <select
              value={form.rarity}
              onChange={update("rarity")}
              className="rounded-md border border-black/10 px-3 py-2 dark:border-white/20 dark:bg-transparent"
            >
              {RARITIES.map((r) => (
                <option key={r} value={r}>
                  {r.replace("_", " ")}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Condition
            <select
              value={form.condition}
              onChange={update("condition")}
              className="rounded-md border border-black/10 px-3 py-2 dark:border-white/20 dark:bg-transparent"
            >
              {CONDITIONS.map((c) => (
                <option key={c} value={c}>
                  {c.replace("_", " ")}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="flex flex-col gap-1 text-sm">
          Price (USD)
          <input
            required
            type="number"
            min="0"
            step="0.01"
            value={form.price}
            onChange={update("price")}
            className="rounded-md border border-black/10 px-3 py-2 dark:border-white/20 dark:bg-transparent"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Image URL (optional)
          <input
            type="url"
            value={form.imageUrl}
            onChange={update("imageUrl")}
            className="rounded-md border border-black/10 px-3 py-2 dark:border-white/20 dark:bg-transparent"
          />
        </label>
        {error && <ErrorState message={error} />}
        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {submitting ? "Adding..." : "Add card"}
        </button>
      </form>
    </main>
  );
}
