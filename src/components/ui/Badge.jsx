const VARIANTS = {
  proceso: 'bg-gold/15 text-gold',
  listo: 'bg-[#7a9c59]/20 text-[#9fd67f]',
  neutral: 'bg-ink-700 text-ink-500',
  alerta: 'bg-red-900/30 text-red-400',
};

export function Badge({ variant = 'neutral', children }) {
  return (
    <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full ${VARIANTS[variant]}`}>
      {children}
    </span>
  );
}
