import Link from "next/link";

function formatPrice(price, currency = "USD") {
  const value = typeof price === "string" ? Number(price) : price;
  if (Number.isNaN(value)) return String(price);
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(value);
}

export default function CardGrid({ cards }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
      {cards.map((card) => (
        <Link
          key={card.id}
          href={`/cards/${card.id}`}
          className="flex flex-col overflow-hidden rounded-lg border border-black/10 transition hover:shadow-md dark:border-white/10"
        >
          <div className="aspect-[3/4] bg-black/5 dark:bg-white/5">
            {card.imageUrl ? (
              // Arbitrary user-supplied URLs - next/image would need every
              // domain allow-listed, so a plain <img> is the simpler choice here.
              // eslint-disable-next-line @next/next/no-img-element
              <img src={card.imageUrl} alt={card.name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-black/40 dark:text-white/40">
                No image
              </div>
            )}
          </div>
          <div className="flex flex-1 flex-col gap-1 p-3">
            <span className="font-medium">{card.name}</span>
            <span className="text-xs text-black/60 dark:text-white/60">{card.set}</span>
            <div className="mt-auto flex items-center justify-between pt-2 text-xs">
              <span className="rounded bg-black/5 px-1.5 py-0.5 dark:bg-white/10">
                {card.rarity.replace("_", " ")}
              </span>
              <span className="font-semibold">{formatPrice(card.price)}</span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
