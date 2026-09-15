export default function LoadingState({ label = "Loading..." }) {
  return (
    <div className="flex items-center justify-center gap-2 py-12 text-sm text-black/60 dark:text-white/60">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      <span>{label}</span>
    </div>
  );
}
