import { describe, it, expect } from 'vitest';
import { getDefaultRoute } from './getDefaultRoute';

// Trang mặc định sau đăng nhập là Tổng quan Vận hành (portal card đã tắt).
describe('getDefaultRoute', () => {
  it('should redirect undefined role to /operations/dashboard', () => {
    expect(getDefaultRoute(undefined)).toBe('/operations/dashboard');
  });

  it('should redirect admin role to /operations/dashboard', () => {
    expect(getDefaultRoute('admin')).toBe('/operations/dashboard');
  });

  it('should redirect employee role to /operations/dashboard', () => {
    expect(getDefaultRoute('employee')).toBe('/operations/dashboard');
  });

  it('should redirect empty string role to /operations/dashboard', () => {
    expect(getDefaultRoute('')).toBe('/operations/dashboard');
  });
});
