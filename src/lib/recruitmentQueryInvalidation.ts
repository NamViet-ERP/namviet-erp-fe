import { queryKeys } from '../services/queryKeys';

export type RecruitmentQueryKey = readonly unknown[];

export const recruitmentInvalidationKeys = {
  candidate: [
    queryKeys.candidates.all,
    queryKeys.recruitmentPlans.all,
    queryKeys.recruitmentCalendar.all,
    queryKeys.recruitmentDashboard.all,
    queryKeys.recruitmentReports.all,
  ],
  plan: [
    queryKeys.recruitmentPlans.all,
    queryKeys.recruitmentDashboard.all,
    queryKeys.recruitmentReports.all,
  ],
  cost: [
    queryKeys.recruitmentCosts.all,
    queryKeys.recruitmentBudget.all,
    queryKeys.recruitmentDashboard.all,
    queryKeys.recruitmentReports.all,
  ],
  budget: [
    queryKeys.recruitmentBudget.all,
    queryKeys.recruitmentCosts.all,
    queryKeys.recruitmentDashboard.all,
    queryKeys.recruitmentReports.all,
  ],
} as const satisfies Record<string, readonly RecruitmentQueryKey[]>;
