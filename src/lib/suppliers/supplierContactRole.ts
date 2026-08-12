/** Vai trò liên hệ NCC — sync với BE SupplierContactRoles. */
export const SUPPLIER_CONTACT_ROLES = [
  { value: 'primary', label: 'Chính' },
  { value: 'secondary', label: 'Phụ' },
  { value: 'backup', label: 'Backup' },
] as const;

export type SupplierContactRole = (typeof SUPPLIER_CONTACT_ROLES)[number]['value'];

export function supplierContactRoleLabel(role: string | undefined | null): string {
  if (!role) return '—';
  return SUPPLIER_CONTACT_ROLES.find(r => r.value === role)?.label ?? role;
}

export function supplierContactRoleTone(
  role: string | undefined | null,
): 'success' | 'primary' | 'neutral' {
  if (role === 'primary') return 'success';
  if (role === 'backup') return 'neutral';
  return 'primary';
}
