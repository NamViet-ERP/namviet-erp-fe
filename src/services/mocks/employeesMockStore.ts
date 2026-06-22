import { createMockLocalStore } from '../../lib/mockLocalStore';
import { mockEmployees } from '../../data/employees';

export const { readStore, writeStore } = createMockLocalStore('nv-employee-data', mockEmployees);
