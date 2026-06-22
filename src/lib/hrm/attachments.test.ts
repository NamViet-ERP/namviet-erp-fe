import { describe, expect, it } from 'vitest';
import { getProfileCropRect } from './attachments';

describe('getProfileCropRect', () => {
  it('crops from top for portrait photos', () => {
    expect(getProfileCropRect(800, 1200)).toEqual({ sx: 0, sy: 0, size: 800 });
  });

  it('center-crops landscape photos', () => {
    expect(getProfileCropRect(1200, 800)).toEqual({ sx: 200, sy: 0, size: 800 });
  });

  it('center-crops square photos', () => {
    expect(getProfileCropRect(500, 500)).toEqual({ sx: 0, sy: 0, size: 500 });
  });
});
