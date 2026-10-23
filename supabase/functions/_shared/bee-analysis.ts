/** IMP-023: shared wire contract. No provider, credentials or scientific content. */
export type TaxonomicLevel = 'family' | 'genus' | 'species';
export type BeeAnalysisStatus = 'possible_match' | 'inconclusive' | 'no_match';
export interface BeeMatch {
  taxonId: string;
  rank: number;
  taxonomicLevel: TaxonomicLevel;
  visualEvidence: string[];
}
export interface BeeAnalysisV2 {
  status: BeeAnalysisStatus;
  matches: BeeMatch[];
  imageQuality: 'adequate' | 'poor';
  limitations: string[];
}

export const BEE_SCHEMA_VERSION = '2.0';
export const BEE_ANALYSIS_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['status', 'matches', 'imageQuality', 'limitations'],
  properties: {
    status: { type: 'string', enum: ['possible_match', 'inconclusive', 'no_match'] },
    matches: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['taxonId', 'rank', 'taxonomicLevel', 'visualEvidence'],
        properties: {
          taxonId: { type: 'string' },
          rank: { type: 'integer' },
          taxonomicLevel: { type: 'string', enum: ['family', 'genus', 'species'] },
          visualEvidence: { type: 'array', items: { type: 'string' } },
        },
      },
    },
    imageQuality: { type: 'string', enum: ['adequate', 'poor'] },
    limitations: { type: 'array', items: { type: 'string' } },
  },
} as const;

/** Technical size limits; not measures of biological confidence. */
export const BEE_ANALYSIS_LIMITS = {
  jsonBytes: 16384,
  matches: 3,
  evidenceItems: 5,
  limitationItems: 5,
  textCharacters: 500,
  taxonIdCharacters: 100,
} as const;

export interface AllowedTaxon {
  id: string;
  taxonomicLevel: TaxonomicLevel;
}

export class BeeAnalysisValidationError extends Error {
  constructor(public readonly code: 'invalid_analysis' | 'invalid_catalog') {
    // Never include provider output, image content or catalog values in errors.
    super(code === 'invalid_catalog' ? 'Catálogo indisponível.' : 'Resposta da análise inválida.');
    this.name = 'BeeAnalysisValidationError';
  }
}

function invalid(): never {
  throw new BeeAnalysisValidationError('invalid_analysis');
}

function record(value: unknown, keys: readonly string[]): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return invalid();
  const candidate = value as Record<string, unknown>;
  if (
    Object.keys(candidate).length !== keys.length ||
    !keys.every((key) => Object.prototype.hasOwnProperty.call(candidate, key))
  )
    return invalid();
  return candidate;
}

function text(value: unknown, limit: number): string {
  if (
    typeof value !== 'string' ||
    !value.trim() ||
    value.length > limit ||
    /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/u.test(value)
  )
    return invalid();
  return value;
}

function texts(value: unknown, limit: number, required: boolean): string[] {
  if (!Array.isArray(value) || value.length > limit || (required && !value.length)) return invalid();
  return value.map((item) => text(item, BEE_ANALYSIS_LIMITS.textCharacters));
}

/** Caller must supply taxa from the approved, immutable catalog version used in the request.
 * This validates structure and catalog membership, never scientific correctness.
 */
export function validateBeeAnalysis(value: unknown, taxa: readonly AllowedTaxon[]): BeeAnalysisV2 {
  const catalog = new Map<string, TaxonomicLevel>();
  if (!Array.isArray(taxa) || !taxa.length) throw new BeeAnalysisValidationError('invalid_catalog');
  for (const taxon of taxa) {
    if (
      !taxon ||
      typeof taxon.id !== 'string' ||
      !taxon.id.trim() ||
      taxon.id.length > BEE_ANALYSIS_LIMITS.taxonIdCharacters ||
      catalog.has(taxon.id) ||
      !['family', 'genus', 'species'].includes(taxon.taxonomicLevel)
    ) {
      throw new BeeAnalysisValidationError('invalid_catalog');
    }
    catalog.set(taxon.id, taxon.taxonomicLevel);
  }
  const root = record(value, ['status', 'matches', 'imageQuality', 'limitations']);
  if (root.status !== 'possible_match' && root.status !== 'inconclusive' && root.status !== 'no_match')
    return invalid();
  if (root.imageQuality !== 'adequate' && root.imageQuality !== 'poor') return invalid();
  if (!Array.isArray(root.matches) || root.matches.length > BEE_ANALYSIS_LIMITS.matches) return invalid();
  if (root.status === 'possible_match' && !root.matches.length) return invalid();
  if (root.status === 'no_match' && root.matches.length) return invalid();
  const limitations = texts(
    root.limitations,
    BEE_ANALYSIS_LIMITS.limitationItems,
    root.status === 'inconclusive' || root.imageQuality === 'poor',
  );
  const seen = new Set<string>();
  const matches = root.matches.map((item, index): BeeMatch => {
    const match = record(item, ['taxonId', 'rank', 'taxonomicLevel', 'visualEvidence']);
    const taxonId = text(match.taxonId, BEE_ANALYSIS_LIMITS.taxonIdCharacters);
    const level = catalog.get(taxonId);
    if (!level || level !== match.taxonomicLevel || seen.has(taxonId) || match.rank !== index + 1) return invalid();
    seen.add(taxonId);
    return {
      taxonId,
      rank: index + 1,
      taxonomicLevel: level,
      visualEvidence: texts(match.visualEvidence, BEE_ANALYSIS_LIMITS.evidenceItems, true),
    };
  });
  return { status: root.status, matches, imageQuality: root.imageQuality, limitations };
}

/** Parses only the model JSON, after the adapter has checked refusal/incomplete. */
export function parseBeeAnalysis(json: string, taxa: readonly AllowedTaxon[]): BeeAnalysisV2 {
  if (typeof json !== 'string' || new TextEncoder().encode(json).byteLength > BEE_ANALYSIS_LIMITS.jsonBytes)
    return invalid();
  let value: unknown;
  try {
    value = JSON.parse(json) as unknown;
  } catch {
    return invalid();
  }
  return validateBeeAnalysis(value, taxa);
}

export function analysisStatusFor(result: BeeAnalysisV2): 'completed' | 'inconclusive' {
  return result.status === 'inconclusive' ? 'inconclusive' : 'completed';
}
