import { describe, it, expect } from 'vitest';
import { getDefaultRoute } from './getDefaultRoute';

describe('getDefaultRoute', () => {
  it('should redirect undefined role to /dashboard', () => {
    expect(getDefaultRoute(undefined)).toBe('/dashboard');
  });

  it('should redirect admin role to /dashboard', () => {
    expect(getDefaultRoute('admin')).toBe('/dashboard');
  });

  it('should redirect employee role to /dashboard', () => {
    expect(getDefaultRoute('employee')).toBe('/dashboard');
  });

  it('should redirect empty string role to /dashboard', () => {
    expect(getDefaultRoute('')).toBe('/dashboard');
  });
});
