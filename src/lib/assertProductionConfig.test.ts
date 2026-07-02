import { describe, it, expect } from 'vitest';
import { assertProductionConfig } from './assertProductionConfig';

describe('assertProductionConfig', () => {
  it('does not throw in development / test mode', () => {
    expect(() => assertProductionConfig()).not.toThrow();
  });
});
