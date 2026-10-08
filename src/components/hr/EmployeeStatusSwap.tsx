import type React from 'react';
import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown } from 'lucide-react';
import { showToast } from '../ui/Toast';
import { getApiErrorMessage } from '../../lib/apiClient';
import { useUpdateEmployee } from '../../hooks/useEmployees';
import type { Employee, EmployeeStatus } from '../../types/hr';

const STATUS_OPTIONS: EmployeeStatus[] = ['Đang làm', 'Nghỉ việc', 'Thai sản'];

const STATUS_PILL_CLASS: Record<EmployeeStatus, string> = {
  'Đang làm': 'hrm-status-pill--working',
  'Nghỉ việc': 'hrm-status-pill--leaved',
  'Thai sản': 'hrm-status-pill--maternity',
};

const STATUS_DOT_CLASS: Record<EmployeeStatus, string> = {
  'Đang làm': 'hrm-status-menu__dot--working',
  'Nghỉ việc': 'hrm-status-menu__dot--leaved',
  'Thai sản': 'hrm-status-menu__dot--maternity',
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

  const pillClass = STATUS_PILL_CLASS[employee.status] ?? STATUS_PILL_CLASS['Đang làm'];

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
      const hasAccount = employee.linkedAccountStatus === 'active' || employee.linkedAccountStatus === 'locked';
      if (next === 'Nghỉ việc') {
        showToast(
          'warning',
          hasAccount
            ? 'Tài khoản hệ thống đã bị khóa.'
            : `${employee.fullName} sẽ không hiện trong các danh sách chọn.`,
          'Đã cập nhật nghỉ việc'
        );
      } else if (employee.status === 'Nghỉ việc' && next === 'Đang làm') {
        showToast(
          'success',
          hasAccount ? 'Tài khoản hệ thống đã được mở lại.' : 'Đã cập nhật trạng thái.',
          'Quay lại làm việc'
        );
      } else {
        showToast('success', `Đã đổi trạng thái sang "${next}".`);
      }
    } catch (e) {
      showToast('error', getApiErrorMessage(e, 'Không thể cập nhật trạng thái'));
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
        className={`hrm-status-pill ${pillClass}${open ? ' hrm-status-pill--open' : ''}`}
      >
        <span className="hrm-status-pill__dot" aria-hidden />
        {employee.status}
        <ChevronDown
          size={14}
          className={`hrm-status-pill__chevron${open ? ' hrm-status-pill__chevron--open' : ''}`}
        />
      </button>

      {open && createPortal(
        <div ref={menuRef} className="hrm-status-menu animate-scale-in" style={menuStyle}>
          {STATUS_OPTIONS.map(option => {
            const selected = option === employee.status;
            const dotClass = STATUS_DOT_CLASS[option];
            return (
              <button
                key={option}
                type="button"
                onClick={() => void handleChange(option)}
                className={`hrm-status-menu__item${selected ? ' hrm-status-menu__item--selected' : ''}`}
              >
                <span className={`hrm-status-menu__dot ${dotClass}`} aria-hidden />
                <span className="hrm-status-menu__label">{option}</span>
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
