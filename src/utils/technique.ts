/**
 * Technique and strategy utilities: path aliases, dependencies, grouping,
 * slug lists, difficulty tiers, and the localized learning content.
 */

import type { Strategy, Technique } from '@sudobility/sudojo_types';
import type { TranslateFunction } from './localizedHint';

export { getTechniqueIconUrl } from '@sudobility/sudojo_types';

// =============================================================================
// Technique path aliases
// =============================================================================

/**
 * API `path` → public slug, for techniques whose API path differs from the
 * public URL slug and their key in `techniques.json`. The web app also
 * 301-redirects `/techniques/3d-medusa` to `/techniques/medusa-coloring`.
 */
const API_TO_CANONICAL_TECHNIQUE_PATH: Readonly<Record<string, string>> = {
  '3d-medusa': 'medusa-coloring',
};

const CANONICAL_TO_API_TECHNIQUE_PATH: Readonly<Record<string, string>> =
  Object.fromEntries(
    Object.entries(API_TO_CANONICAL_TECHNIQUE_PATH).map(
      ([apiPath, canonicalPath]) => [canonicalPath, apiPath]
    )
  );

/**
 * The public slug for a technique path (URL, share link, locale key).
 * `3d-medusa` → `medusa-coloring`; other paths are returned unchanged.
 */
export function toCanonicalTechniquePath(path: string): string;
// eslint-disable-next-line no-redeclare -- overload
export function toCanonicalTechniquePath(
  path: string | null | undefined
): string | undefined;
// eslint-disable-next-line no-redeclare -- overload
export function toCanonicalTechniquePath(
  path: string | null | undefined
): string | undefined {
  if (!path) return undefined;
  return API_TO_CANONICAL_TECHNIQUE_PATH[path] || path;
}

/**
 * The API's `path` for a technique slug. `medusa-coloring` → `3d-medusa`;
 * other paths are returned unchanged.
 */
export function toApiTechniquePath(path: string): string;
// eslint-disable-next-line no-redeclare -- overload
export function toApiTechniquePath(
  path: string | null | undefined
): string | undefined;
// eslint-disable-next-line no-redeclare -- overload
export function toApiTechniquePath(
  path: string | null | undefined
): string | undefined {
  if (!path) return undefined;
  return CANONICAL_TO_API_TECHNIQUE_PATH[path] || path;
}

/** Whether two technique paths name the same technique, aliases included. */
export function isSameTechniquePath(
  a: string | null | undefined,
  b: string | null | undefined
): boolean {
  if (!a || !b) return false;
  return toCanonicalTechniquePath(a) === toCanonicalTechniquePath(b);
}

/**
 * Find a technique by path, accepting either the API path or the canonical
 * slug (`3d-medusa` and `medusa-coloring` both find 3D Medusa).
 */
export function findTechniqueByPath<T extends Pick<Technique, 'path'>>(
  techniques: readonly T[],
  path: string | null | undefined
): T | undefined {
  if (!path) return undefined;
  return techniques.find(t => isSameTechniquePath(t.path, path));
}

// =============================================================================
// Dependencies
// =============================================================================

/**
 * Parse a technique's comma-separated `dependencies` field into technique ids.
 * Blank and non-numeric entries are dropped.
 */
export function parseTechniqueDependencies(
  dependencies: string | null | undefined
): number[] {
  if (!dependencies) return [];
  return dependencies
    .split(',')
    .map(s => parseInt(s.trim(), 10))
    .filter(n => !isNaN(n));
}

/**
 * The techniques a technique builds on ("Requires"), in the order of `all`.
 */
export function getTechniqueDependencies<
  T extends Pick<Technique, 'technique'>,
>(
  technique: Pick<Technique, 'dependencies'> | null | undefined,
  all: readonly T[]
): T[] {
  const ids = parseTechniqueDependencies(technique?.dependencies);
  if (ids.length === 0) return [];
  return all.filter(t => ids.includes(t.technique));
}

/**
 * The techniques that list this one as a dependency ("Learn after"),
 * in the order of `all`.
 */
export function getDependentTechniques<
  T extends Pick<Technique, 'technique' | 'dependencies'>,
>(
  technique: Pick<Technique, 'technique'> | null | undefined,
  all: readonly T[]
): T[] {
  if (!technique) return [];
  const id = technique.technique;
  return all.filter(t =>
    parseTechniqueDependencies(t.dependencies).includes(id)
  );
}

// =============================================================================
// Grouping and sorting
// =============================================================================

/** Sort techniques by level (unassigned first), then by technique number. */
export function sortTechniquesByLevel<
  T extends Pick<Technique, 'technique' | 'level'>,
>(techniques: readonly T[]): T[] {
  return [...techniques].sort((a, b) => {
    if (a.level !== b.level) {
      return (a.level ?? 0) - (b.level ?? 0);
    }
    return a.technique - b.technique;
  });
}

/**
 * Group techniques by level, each group sorted by technique number, keys in
 * ascending level order. This is what useTechniques' `techniquesByLevel` returns.
 *
 * @param options.includeUnassigned - Keep techniques with no level under key 0
 *   (default true, like useTechniques). The web TechniquesPage drops them: pass false.
 */
export function groupTechniquesByLevel<
  T extends Pick<Technique, 'technique' | 'level'>,
>(
  techniques: readonly T[],
  options: { includeUnassigned?: boolean } = {}
): Map<number, T[]> {
  const { includeUnassigned = true } = options;
  const byLevel = new Map<number, T[]>();
  for (const technique of sortTechniquesByLevel(techniques)) {
    const key = technique.level ?? 0;
    if (key === 0 && !includeUnassigned) continue;
    const existing = byLevel.get(key) ?? [];
    existing.push(technique);
    byLevel.set(key, existing);
  }
  return byLevel;
}

/**
 * The techniques in a strategy, sorted by technique number (as the web
 * StrategiesPage and the RN strategy screens list them).
 */
export function getTechniquesForStrategy<
  T extends Pick<Technique, 'technique' | 'strategy_id'>,
>(techniques: readonly T[], strategyId: number | null | undefined): T[] {
  if (strategyId == null) return [];
  return techniques
    .filter(t => t.strategy_id === strategyId)
    .sort((a, b) => a.technique - b.technique);
}

/** Find a strategy by its URL stub. */
export function findStrategyByStub<S extends Pick<Strategy, 'stub'>>(
  strategies: readonly S[],
  stub: string | null | undefined
): S | undefined {
  if (!stub) return undefined;
  return strategies.find(s => s.stub === stub);
}

// =============================================================================
// Slug lists
// =============================================================================

/**
 * Public slugs of all 60 techniques, in footer / sitemap order (canonical
 * slugs, e.g. `medusa-coloring`). Same list as sudojo_app's useFooterConfig
 * and SitemapPage.
 */
export const TECHNIQUE_SLUGS = [
  'full-house',
  'hidden-single',
  'naked-single',
  'hidden-pair',
  'naked-pair',
  'locked-candidates',
  'hidden-triple',
  'naked-triple',
  'hidden-quad',
  'naked-quad',
  'x-wing',
  'swordfish',
  'jellyfish',
  'xy-wing',
  'finned-x-wing',
  'squirmbag',
  'finned-swordfish',
  'finned-jellyfish',
  'xyz-wing',
  'wxyz-wing',
  'almost-locked-sets',
  'finned-squirmbag',
  'als-chain',
  'skyscraper',
  'two-string-kite',
  'empty-rectangle',
  'simple-coloring',
  'w-wing',
  'remote-pairs',
  'unique-rectangle-type-1',
  'unique-rectangle-type-2',
  'bug-1',
  'sue-de-coq',
  'als-xz',
  'x-cycles',
  'forcing-chains',
  'medusa-coloring',
  'crane',
  'unique-rectangle-type-3',
  'unique-rectangle-type-4',
  'unique-rectangle-type-5',
  'x-chain',
  'xy-chain',
  'vwxyz-wing',
  'uvwxyz-wing',
  'tuvwxyz-wing',
  'stuvwxyz-wing',
  'aic',
  'forcing-net',
  'avoidable-rectangle',
  'sashimi-x-wing',
  'sashimi-swordfish',
  'sashimi-jellyfish',
  'hidden-unique-rectangle',
  'firework',
  'death-blossom',
  'franken-x-wing',
  'franken-swordfish',
  'franken-jellyfish',
  'grouped-x-cycles',
] as const;

/** A public technique slug. */
export type TechniqueSlug = (typeof TECHNIQUE_SLUGS)[number];

/** Stubs of the 17 strategies, in difficulty order (sudojo_app's footer list). */
export const STRATEGY_SLUGS = [
  'naked-subsets',
  'hidden-subsets',
  'locked-candidates',
  'basic-fish',
  'finned-sashimi-fish',
  'franken-fish',
  'single-digit-patterns',
  'wings',
  'unique-rectangles',
  'coloring',
  'remote-pairs',
  'almost-locked-sets',
  'bug-plus-one',
  'firework',
  'single-digit-chains',
  'multi-digit-chains',
  'forcing',
] as const;

/** A strategy stub. */
export type StrategySlug = (typeof STRATEGY_SLUGS)[number];

// =============================================================================
// Strategy difficulty and content
// =============================================================================

/** Difficulty tier of a strategy, shown as a badge. */
export type StrategyDifficultyTier =
  'beginner' | 'intermediate' | 'advanced' | 'expert' | 'master';

/**
 * Tier for a strategy's `difficulty`: ≤3 beginner, ≤5 intermediate,
 * ≤9 advanced, ≤12 expert, otherwise master.
 */
export function getStrategyDifficultyTier(
  difficulty: number
): StrategyDifficultyTier {
  if (difficulty <= 3) return 'beginner';
  if (difficulty <= 5) return 'intermediate';
  if (difficulty <= 9) return 'advanced';
  if (difficulty <= 12) return 'expert';
  return 'master';
}

/** i18n key (default namespace) for a strategy's tier, e.g. `strategy.expert`. */
export function getStrategyDifficultyKey(difficulty: number): string {
  return `strategy.${getStrategyDifficultyTier(difficulty)}`;
}

/** Most sections a strategy can have in `strategies.json`. */
const MAX_STRATEGY_SECTIONS = 20;

/** One section of a strategy's localized description. */
export interface StrategySection {
  /** Section title */
  title: string;
  /** Section body ('' when missing) */
  text: string;
  /** Non-blank lines of `text` */
  paragraphs: string[];
}

/**
 * Translate `key`, returning '' on a miss (missing key echoed back or empty).
 */
function translateOrEmpty(t: TranslateFunction, key: string): string {
  const translated = t(key, { defaultValue: '' });
  return translated && translated !== key ? translated : '';
}

/**
 * Collect the sections of a strategy from the `strategies` namespace:
 * `${stub}.1.title` / `${stub}.1.text`, `${stub}.2.*`, ... up to 20, stopping
 * at the first missing title.
 *
 * @param t - Translate function for the `strategies` namespace
 */
export function getStrategySections(
  t: TranslateFunction,
  stub: string | null | undefined
): StrategySection[] {
  if (!stub) return [];
  const result: StrategySection[] = [];
  for (let n = 1; n <= MAX_STRATEGY_SECTIONS; n++) {
    const key = `${stub}.${n}`;
    const title = translateOrEmpty(t, `${key}.title`);
    if (!title) break;
    const text = translateOrEmpty(t, `${key}.text`);
    result.push({
      title,
      text,
      paragraphs: text.split('\n').filter(p => p.trim()),
    });
  }
  return result;
}

/** A technique's localized learning content from the `techniques` namespace. */
export interface TechniqueContent {
  /** `${path}.overview`, or '' */
  overview: string;
  /** `${path}.how-it-works`, one entry per line, leading "1. " numbering removed */
  howItWorks: string[];
  /** `${path}.tips`, split into sentences */
  tips: string[];
}

/**
 * Read a technique's overview, how-it-works steps and tips.
 *
 * The path is canonicalized (`3d-medusa` → `medusa-coloring`), which is how
 * `techniques.json` is keyed.
 *
 * @param t - Translate function for the `techniques` namespace
 */
export function parseTechniqueContent(
  t: TranslateFunction,
  path: string | null | undefined
): TechniqueContent {
  const key = toCanonicalTechniquePath(path);
  if (!key) return { overview: '', howItWorks: [], tips: [] };
  const howItWorks = translateOrEmpty(t, `${key}.how-it-works`);
  const tips = translateOrEmpty(t, `${key}.tips`);
  return {
    overview: translateOrEmpty(t, `${key}.overview`),
    howItWorks: howItWorks
      .split('\n')
      .filter(Boolean)
      .map(step => step.replace(/^\d+\.\s*/, '')),
    tips: tips
      .split(/(?<=\.)\s+/)
      .filter(Boolean)
      .map(tip => tip.trim()),
  };
}
