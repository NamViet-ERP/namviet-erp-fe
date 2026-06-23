import type { TabItem } from '../../types';

/**
 * MD3 Primary Tabs
 * Active: primary indicator underline + primary text
 * Inactive: on-surface-variant text, state layer hover
 */

interface TabFilterProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (id: string) => void;
}

export default function TabFilter({ tabs, activeTab, onChange }: TabFilterProps) {
  return (
    <div className="tab-filter">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`tab-filter__tab${isActive ? ' tab-filter__tab--active' : ''}`}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span className={`tab-filter__count${isActive ? ' tab-filter__count--active' : ''}`}>
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
