/**
 * Exact technique bitmasks for game pages.
 *
 * Bit N = technique id N (currently 1-60; the wire mask supports 128 bits).
 * A mask with any id >= 54 set exceeds 2^53, so the numeric `techniques`
 * field from the API is lossy. The API also sends an
 * exact base-10 `techniques_bitmask` string: read it into a `bigint`, and send
 * it back as a string. Built on sudojo_types' techniqueBitmaskOf /
 * parseTechniqueBitmask / formatTechniqueBitmask.
 */

import {
  formatTechniqueBitmask,
  parseTechniqueBitmask,
  techniqueBitmaskOf,
  type TechniqueBitmaskSource,
} from '@sudobility/sudojo_types';

/**
 * The exact bitmask of a board, daily, validate result or game meta.
 *
 * Unlike `techniqueBitmaskOf`, this never throws, because it runs inside page
 * effects: a malformed `techniques_bitmask` falls back to the numeric field,
 * and an invalid number falls back to `0n`.
 */
export function exactTechniqueBitmask(
  source: TechniqueBitmaskSource | null | undefined
): bigint {
  if (!source) return 0n;
  try {
    return techniqueBitmaskOf(source);
  } catch {
    try {
      return parseTechniqueBitmask(source.techniques);
    } catch {
      return 0n;
    }
  }
}

/** The exact bitmask as the base-10 string that API requests take. */
export function techniqueBitmaskString(
  source: TechniqueBitmaskSource | null | undefined
): string {
  return formatTechniqueBitmask(exactTechniqueBitmask(source));
}

/**
 * The `techniques` / `techniques_bitmask` pair to copy onto game meta
 * (CurrentGameMeta) or a resumed Board/Daily. Keeps the (lossy) number and adds
 * the exact string, upgrading legacy meta that only has the number. Both are
 * null when the source carries no bitmask.
 */
export function techniqueFieldsOf(
  source: TechniqueBitmaskSource | null | undefined
): {
  techniques: number | null;
  techniques_bitmask: string | null;
} {
  if (
    !source ||
    (source.techniques == null && source.techniques_bitmask == null)
  ) {
    return { techniques: null, techniques_bitmask: null };
  }
  return {
    techniques: source.techniques ?? null,
    techniques_bitmask: techniqueBitmaskString(source),
  };
}
