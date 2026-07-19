export function Button({ variant = 'primary', className = '', ...props }) {
  const base = 'font-bold text-sm px-4 py-2 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed';
  const variants = {
    primary: 'bg-gold text-ink-950 hover:bg-gold-dark',
    secondary: 'bg-transparent border border-ink-700 text-ink-500 hover:border-gold hover:text-gold',
  };
  return <button className={`${base} ${variants[variant]} ${className}`} {...props} />;
}
