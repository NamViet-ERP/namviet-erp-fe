import { createMockLocalStore } from '../localStore';
import { RECRUITMENT_POSITIONS } from '../../constants/recruitment';
import type { RecruitmentPosition } from '../../services/positionsService';

const initial: RecruitmentPosition[] = RECRUITMENT_POSITIONS.map(name => ({
  name,
  isActive: true,
}));

export const { readStore, writeStore } = createMockLocalStore('nv-recruitment-positions-v2', initial);
