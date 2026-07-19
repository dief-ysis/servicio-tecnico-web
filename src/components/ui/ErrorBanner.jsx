export function ErrorBanner({ message }) {
  if (!message) return null;
  return (
    <div className="bg-red-950/50 border border-red-800 text-red-300 text-sm rounded-md px-3 py-2">
      {message}
    </div>
  );
}
