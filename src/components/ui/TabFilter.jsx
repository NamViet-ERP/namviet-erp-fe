export default function TabFilter({ tabs, activeTab, onChange }) {
  return (
    <div className="flex items-center gap-1 border-b border-gray-200 mb-4">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`px-4 py-2.5 text-sm font-medium transition-all duration-200 border-b-2 -mb-px
            ${activeTab === tab.id
              ? 'text-brand-orange border-brand-orange'
              : 'text-navy-500 border-transparent hover:text-navy-700 hover:border-gray-300'
            }`}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span className={`ml-1.5 text-xs ${activeTab === tab.id ? 'text-brand-orange' : 'text-gray-400'}`}>
              ({tab.count})
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
