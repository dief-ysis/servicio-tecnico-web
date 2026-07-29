export function Checkbox({ label, id, checked, onChange, ...props }) {
  return (
    <label htmlFor={id} className="flex items-center gap-2 text-sm text-ink-500 cursor-pointer">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="w-4 h-4 rounded border-ink-700 bg-ink-800 text-gold focus:ring-gold focus:ring-offset-0"
        {...props}
      />
      {label}
    </label>
  );
}
