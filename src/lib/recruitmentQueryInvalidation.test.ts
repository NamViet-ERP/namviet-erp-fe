import { describe, expect, it } from 'vitest';
import { recruitmentInvalidationKeys } from './recruitmentQueryInvalidation';

describe('recruitment query invalidation dependencies', () => {
  it('invalidates every candidate-derived surface after candidate mutations', () => {
    expect(recruitmentInvalidationKeys.candidate).toEqual([
      ['candidates'],
      ['recruitmentPlans'],
      ['recruitmentCalendar'],
      ['recruitmentDashboard'],
      ['recruitmentReports'],
    ]);
  });

  it('invalidates plan-derived dashboard and report data', () => {
    expect(recruitmentInvalidationKeys.plan).toEqual([
      ['recruitmentPlans'],
      ['recruitmentDashboard'],
      ['recruitmentReports'],
    ]);
  });

  it('invalidates cost and budget dependencies including analytics', () => {
    expect(recruitmentInvalidationKeys.cost).toEqual([
      ['recruitmentCosts'],
      ['recruitmentBudget'],
      ['recruitmentDashboard'],
      ['recruitmentReports'],
    ]);
    expect(recruitmentInvalidationKeys.budget).toEqual([
      ['recruitmentBudget'],
      ['recruitmentCosts'],
      ['recruitmentDashboard'],
      ['recruitmentReports'],
    ]);
  });
});
