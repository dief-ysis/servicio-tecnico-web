export function Input({ label, id, className = '', ...props }) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={id} className="text-xs text-ink-500">{label}</label>
      )}
      <input
        id={id}
        className={`bg-ink-800 border border-ink-700 rounded-md px-3 py-2 text-sm text-white placeholder:text-ink-400 focus:outline-none focus:border-gold ${className}`}
        {...props}
      />
    </div>
  );
}
