import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { CandidateApiDto } from '../lib/hrm/candidateApiMapper';
import type { CreateCandidateDto } from '../types/hr';

const post = vi.hoisted(() => vi.fn());
const patch = vi.hoisted(() => vi.fn());

vi.mock('../lib/apiClient', () => ({
  apiClient: {
    post,
    patch,
  },
  saveBlob: vi.fn(),
}));

import { candidatesService } from './candidatesService';

const apiCandidate: CandidateApiDto = {
  id: 'candidate-1',
  fullName: 'Nguyễn Văn A',
  phone: '0900000000',
  email: 'a@example.com',
  gender: 'Nam',
  address: 'Hà Nội',
  birthDate: '01/01/2000',
  education: 'University',
  school: 'Đại học',
  major: 'CNTT',
  position: 'Kỹ sư',
  experience: '2',
  source: 'TopCV',
  hrResponsible: 'HR A',
  cvFileName: 'cv.pdf',
  cvFileSize: '1 MB',
  appliedAt: '17/07/2026 10:00',
  status: 'New',
};

const candidateInput: CreateCandidateDto = {
  fullName: apiCandidate.fullName,
  phone: apiCandidate.phone,
  email: apiCandidate.email,
  gender: 'Nam',
  address: apiCandidate.address,
  birthDate: '2000-01-01',
  education: 'Đại học',
  school: apiCandidate.school,
  major: apiCandidate.major,
  position: apiCandidate.position,
  experience: apiCandidate.experience,
  source: 'TopCV',
  hrResponsible: 'HR A',
  cvFileName: apiCandidate.cvFileName,
  cvFileSize: apiCandidate.cvFileSize,
  status: 'Screening',
};

describe('candidate create contracts', () => {
  beforeEach(() => {
    post.mockReset();
    post.mockResolvedValue(apiCandidate);
    patch.mockReset();
    patch.mockResolvedValue(apiCandidate);
  });

  it('uses the authenticated create endpoint with internal fields', async () => {
    await candidatesService.create(candidateInput);

    expect(post).toHaveBeenCalledWith(
      '/api/candidates',
      expect.objectContaining({
        fullName: candidateInput.fullName,
        hrResponsible: 'HR A',
        status: 'Screening',
        birthDate: '01/01/2000',
      }),
    );
  });

  it('uses the public apply endpoint without privileged workflow fields', async () => {
    const { hrResponsible: _hrResponsible, status: _status, ...publicInput } = candidateInput;
    void _hrResponsible;
    void _status;

    await candidatesService.applyPublic(publicInput);

    expect(post).toHaveBeenCalledWith(
      '/api/candidates/apply',
      expect.objectContaining({
        fullName: publicInput.fullName,
        birthDate: '01/01/2000',
      }),
    );
    const payload = post.mock.calls[0]?.[1] as Record<string, unknown>;
    expect(payload).not.toHaveProperty('hrResponsible');
    expect(payload).not.toHaveProperty('status');
    expect(payload).not.toHaveProperty('recruitmentPlanId');
  });

  it('sends recruitment plan assignment in status updates', async () => {
    await candidatesService.updateStatus(apiCandidate.id, {
      status: 'Accepted',
      recruitmentPlanId: 'plan-7',
    });

    expect(patch).toHaveBeenCalledWith(
      '/api/candidates/candidate-1/status',
      expect.objectContaining({
        status: 'Accepted',
        recruitmentPlanId: 'plan-7',
      }),
    );
  });
});
