import { describe, expect, it } from 'vitest';
import { fromApi, toApi, type CandidateApiDto } from './candidateApiMapper';

const apiCandidate: CandidateApiDto = {
  id: '12',
  fullName: 'Nguyễn Văn A',
  phone: '0900000000',
  email: 'a@example.com',
  gender: 'Nam',
  address: 'Hà Nội',
  birthDate: '01/01/2000',
  education: 'University',
  school: '',
  major: '',
  position: 'Kỹ sư',
  experience: '2',
  source: 'TopCV',
  hrResponsible: '',
  cvFileName: '',
  cvFileSize: '',
  appliedAt: '17/07/2026 10:00',
  status: 'Accepted',
  recruitmentPlanId: '7',
  recruitmentPlanLabel: 'Kỹ sư - Q3-2026',
};

describe('candidate plan mapping', () => {
  it('maps linked plan fields from the API', () => {
    const candidate = fromApi(apiCandidate);

    expect(candidate.recruitmentPlanId).toBe('7');
    expect(candidate.recruitmentPlanLabel).toBe('Kỹ sư - Q3-2026');
  });

  it('maps linked plan id to internal update payloads', () => {
    const candidate = fromApi(apiCandidate);
    const payload = toApi(candidate, candidate.id);

    expect(payload.recruitmentPlanId).toBe('7');
  });
});
