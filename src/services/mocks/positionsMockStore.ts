import { createMockLocalStore } from '../../lib/mockLocalStore';
import { RECRUITMENT_POSITIONS } from '../../constants/recruitment';
import type { RecruitmentPosition } from '../positionsService';

const initial: RecruitmentPosition[] = RECRUITMENT_POSITIONS.map(name => ({
  name,
  isActive: true,
}));

export const { readStore, writeStore } = createMockLocalStore('nv-recruitment-positions-v2', initial);
