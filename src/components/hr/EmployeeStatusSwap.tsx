import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown } from 'lucide-react';
import { showToast } from '../ui/Toast';
import { useUpdateEmployee } from '../../hooks/useEmployees';
import { systemUsers } from '../../constants/systemUsers';
import type { Employee, EmployeeStatus } from '../../types/hr';

const STATUS_OPTIONS: EmployeeStatus[] = ['Đang làm', 'Nghỉ việc', 'Thai sản'];

const statusMeta: Record<EmployeeStatus, { dot: string; pillBg: string; pillText: string; pillBorder: string }> = {
  'Đang làm': {
    dot: 'var(--status-success)',
    pillBg: 'color-mix(in srgb, var(--md-success-container) 55%, var(--md-surface-container-high))',
    pillText: 'var(--md-on-success-container)',
    pillBorder: 'color-mix(in srgb, var(--status-success) 28%, transparent)',
  },
  'Nghỉ việc': {
    dot: 'var(--status-error)',
    pillBg: 'color-mix(in srgb, var(--md-error-container) 55%, var(--md-surface-container-high))',
    pillText: 'var(--md-on-error-container)',
    pillBorder: 'color-mix(in srgb, var(--status-error) 28%, transparent)',
  },
  'Thai sản': {
    dot: 'var(--status-warning)',
    pillBg: 'color-mix(in srgb, var(--md-warning-container) 55%, var(--md-surface-container-high))',
    pillText: 'var(--md-on-warning-container)',
    pillBorder: 'color-mix(in srgb, var(--status-warning) 28%, transparent)',
  },
};

interface EmployeeStatusSwapProps {
  employee: Employee;
}

export default function EmployeeStatusSwap({ employee }: EmployeeStatusSwapProps) {
  const updateMutation = useUpdateEmployee();
  const [open, setOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});
  const rootRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const meta = statusMeta[employee.status] ?? statusMeta['Đang làm'];

  const calculatePosition = useCallback(() => {
    if (!rootRef.current) return;
    const rect = rootRef.current.getBoundingClientRect();
    const menuHeight = STATUS_OPTIONS.length * 40 + 12;
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUp = spaceBelow < menuHeight + 8 && rect.top > spaceBelow;

    setMenuStyle({
      position: 'fixed',
      top: openUp ? undefined : rect.bottom + 6,
      bottom: openUp ? window.innerHeight - rect.top + 6 : undefined,
      left: rect.left,
      minWidth: Math.max(rect.width, 168),
      zIndex: 99999,
    });
  }, []);

  useEffect(() => {
    if (!open) return;
    calculatePosition();
    const onScroll = () => calculatePosition();
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onScroll);
    };
  }, [open, calculatePosition]);

  useEffect(() => {
    if (!open) return;
    const onOutside = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!rootRef.current?.contains(t) && !menuRef.current?.contains(t)) setOpen(false);
    };
    document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, [open]);

  const handleChange = async (next: EmployeeStatus) => {
    if (next === employee.status || updateMutation.isPending) return;
    setOpen(false);
    try {
      await updateMutation.mutateAsync({ id: employee.id, dto: { status: next } });
      const linkedAccount = systemUsers.find(u => u.employeeId === employee.id);
      if (next === 'Nghỉ việc') {
        showToast(
          'warning',
          linkedAccount
            ? `Tài khoản ${linkedAccount.username} đã bị khóa.`
            : `${employee.fullName} sẽ không hiện trong các danh sách chọn.`,
          'Đã cập nhật nghỉ việc'
        );
      } else if (employee.status === 'Nghỉ việc' && next === 'Đang làm') {
        showToast(
          'success',
          linkedAccount ? `Tài khoản ${linkedAccount.username} đã được mở lại.` : 'Đã cập nhật trạng thái.',
          'Quay lại làm việc'
        );
      } else {
        showToast('success', `Đã đổi trạng thái sang "${next}".`);
      }
    } catch (e) {
      showToast('error', e instanceof Error ? e.message : 'Không thể cập nhật trạng thái');
    }
  };

  return (
    <div
      ref={rootRef}
      className="inline-block"
      onClick={e => e.stopPropagation()}
      onKeyDown={e => e.stopPropagation()}
    >
      <button
        type="button"
        disabled={updateMutation.isPending}
        title="Đổi trạng thái"
        onClick={() => {
          if (!open) calculatePosition();
          setOpen(v => !v);
        }}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '5px 10px 5px 12px',
          borderRadius: '9999px',
          border: `1px solid ${meta.pillBorder}`,
          background: meta.pillBg,
          color: meta.pillText,
          fontFamily: "'Roboto', sans-serif",
          fontSize: '0.75rem',
          fontWeight: 600,
          letterSpacing: '0.02em',
          cursor: updateMutation.isPending ? 'wait' : 'pointer',
          opacity: updateMutation.isPending ? 0.65 : 1,
          transition: 'box-shadow 200ms var(--md-easing), transform 150ms var(--md-easing)',
          boxShadow: open ? 'var(--md-shadow-2)' : 'none',
          whiteSpace: 'nowrap',
        }}
        onMouseEnter={e => { if (!open) e.currentTarget.style.boxShadow = 'var(--md-shadow-1)'; }}
        onMouseLeave={e => { if (!open) e.currentTarget.style.boxShadow = 'none'; }}
      >
        <span
          style={{
            width: 7,
            height: 7,
            borderRadius: '50%',
            background: meta.dot,
            flexShrink: 0,
          }}
        />
        {employee.status}
        <ChevronDown
          size={14}
          style={{
            opacity: 0.75,
            transition: 'transform 200ms var(--md-easing)',
            transform: open ? 'rotate(180deg)' : 'none',
          }}
        />
      </button>

      {open && createPortal(
        <div ref={menuRef} className="hrm-status-menu animate-scale-in" style={menuStyle}>
          {STATUS_OPTIONS.map(option => {
            const opt = statusMeta[option];
            const selected = option === employee.status;
            return (
              <button
                key={option}
                type="button"
                onClick={() => void handleChange(option)}
                className={`hrm-status-menu__item${selected ? ' hrm-status-menu__item--selected' : ''}`}
              >
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: opt.dot,
                    flexShrink: 0,
                  }}
                />
                <span style={{ flex: 1 }}>{option}</span>
                {selected && <Check size={15} strokeWidth={2.5} />}
              </button>
            );
          })}
        </div>,
        document.body
      )}
    </div>
  );
}
