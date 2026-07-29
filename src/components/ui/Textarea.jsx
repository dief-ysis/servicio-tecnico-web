export function Textarea({ label, id, className = '', ...props }) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={id} className="text-xs text-ink-500">{label}</label>
      )}
      <textarea
        id={id}
        rows={2}
        className={`bg-ink-800 border border-ink-700 rounded-md px-3 py-2 text-sm text-white placeholder:text-ink-400 focus:outline-none focus:border-gold resize-none ${className}`}
        {...props}
      />
    </div>
  );
}
