export function Select({ label, id, className = '', children, ...props }) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={id} className="text-xs text-ink-500">{label}</label>
      )}
      <select
        id={id}
        className={`bg-ink-800 border border-ink-700 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-gold ${className}`}
        {...props}
      >
        {children}
      </select>
    </div>
  );
}
