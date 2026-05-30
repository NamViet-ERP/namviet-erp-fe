const accentColors = {
  amber:  { bar: '#c07a2a', bg: '#faf5ed', icon: '#d4943a', iconBg: '#faf5ed' },
  blue:   { bar: '#3a6ea5', bg: '#eef3fa', icon: '#4a80b5', iconBg: '#eef3fa' },
  teal:   { bar: '#2a8a6a', bg: '#ebf5f0', icon: '#3a9a78', iconBg: '#ebf5f0' },
  purple: { bar: '#6a5aaa', bg: '#f0ecfa', icon: '#7a6aba', iconBg: '#f0ecfa' },
  red:    { bar: '#b54a3a', bg: '#faf0ee', icon: '#c05a4a', iconBg: '#faf0ee' },
};

export default function Card({ title, value, subtitle, accent = 'blue', icon: Icon, className = '' }) {
  const colors = accentColors[accent] || accentColors.blue;

  return (
    <div className={`bg-white rounded-xl overflow-hidden transition-all duration-200 hover:shadow-card-hover ${className}`}
      style={{ border: '1px solid #e8eaef' }}>
      <div className="flex">
        {/* Accent bar */}
        <div className="w-1 flex-shrink-0" style={{ background: colors.bar }} />

        <div className="flex-1 p-5 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.05em] mb-1" style={{ color: '#8890a5' }}>{title}</p>
            <p className="text-[26px] font-bold leading-none tracking-tight" style={{ color: '#1a1e2e' }}>{value}</p>
            {subtitle && <p className="text-[12px] mt-2" style={{ color: '#9a9fb0' }}>{subtitle}</p>}
          </div>
          {Icon && (
            <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: colors.iconBg }}>
              <Icon size={20} style={{ color: colors.icon }} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
