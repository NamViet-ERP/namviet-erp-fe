import { useMemo, useState } from 'react';
import { Check, Search } from 'lucide-react';
import { getLoginEligibleUsers, setSessionUser, type SystemUser } from '../../constants/systemUsers';

interface RoleSwitcherProps {
  activeUserId: string;
  onSwitch: (user: SystemUser) => void;
  /** Chỉ chọn trước khi đăng nhập — không ghi session */
  previewOnly?: boolean;
  compact?: boolean;
  /** Không viền dưới — dùng trong form login */
  embedded?: boolean;
}

export default function RoleSwitcher({ activeUserId, onSwitch, previewOnly = false, compact = false, embedded = false }: RoleSwitcherProps) {
  const [query, setQuery] = useState('');
  const users = getLoginEligibleUsers();

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return users;
    return users.filter(
      u =>
        u.name.toLowerCase().includes(q) ||
        u.roleLabel.toLowerCase().includes(q) ||
        u.username.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q),
    );
  }, [users, query]);

  const handleSelect = (user: SystemUser) => {
    if (user.id === activeUserId) return;
    if (!previewOnly) setSessionUser(user);
    onSwitch(user);
  };

  return (
    <div className={`role-switcher${compact ? ' role-switcher--compact' : ''}${embedded ? ' role-switcher--embedded' : ''}`}>
      <label className="role-switcher__label">Vai trò mô phỏng</label>

      <div className="role-switcher__search">
        <Search size={14} className="role-switcher__search-icon" aria-hidden />
        <input
          type="search"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Tìm tên, vai trò, email..."
          className="role-switcher__search-input"
          aria-label="Tìm người dùng mô phỏng"
        />
      </div>

      <ul className="role-switcher__list" role="listbox" aria-label="Danh sách vai trò mô phỏng">
        {filtered.length === 0 ? (
          <li className="role-switcher__empty">Không tìm thấy người dùng phù hợp.</li>
        ) : (
          filtered.map(user => {
            const selected = user.id === activeUserId;
            return (
              <li key={user.id} role="option" aria-selected={selected}>
                <button
                  type="button"
                  className={`role-switcher__item${selected ? ' role-switcher__item--selected' : ''}`}
                  onClick={() => handleSelect(user)}
                >
                  <span className="role-switcher__avatar" aria-hidden>
                    {user.initials}
                  </span>
                  <span className="role-switcher__meta">
                    <span className="role-switcher__name">{user.name}</span>
                    <span className="role-switcher__role">{user.roleLabel}</span>
                  </span>
                  {selected && <Check size={16} className="role-switcher__check" strokeWidth={2.5} />}
                </button>
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}
