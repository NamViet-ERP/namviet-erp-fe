/**
 * Import Excel parse — OpenAPI aliases.
 * Regenerate: `npm run api:sync` (BE must be up).
 */
import type { components } from '../generated/openapi';

type Schemas = components['schemas'];

export type ImportParsedLineApiDto = Schemas['ImportParsedLineDto'];
export type ImportParseErrorApiDto = Schemas['ImportParseErrorDto'];
export type ImportParseResultApiDto = Schemas['ImportParseResultDto'];
