/**
 * Share URL builder and parser for Sudojo sharing.
 *
 * Paths match the web app's routes (the RN app's deep-link config accepts the
 * same paths):
 *
 * | type         | URL                                                     |
 * |--------------|---------------------------------------------------------|
 * | `daily`      | `/play/daily` (bare `/daily` has no web route)        |
 * | `puzzle`     | `/play/puzzle?level=&original=&user=&autopencilmarks=&pencilmarks=&hint=` |
 * | `levels`     | `/play` (the level list)                                |
 * | `play`       | `/play/<level>`, or `/play` without a level             |
 * | `enter`      | `/play/enter`                                           |
 * | `techniques` | `/techniques`                                           |
 * | `technique`  | `/techniques/<canonical path>[?hint=<step>]`            |
 *
 * Pencilmarks are appended as a raw comma-separated string (not URL-encoded)
 * to keep URLs readable.
 */

import { isValidLevel } from '@sudobility/sudojo_types';
import { toCanonicalTechniquePath } from './technique';

const DEFAULT_DOMAIN = 'https://sudojo.com';

/** An empty 81-cell input string. */
const EMPTY_INPUT = '0'.repeat(81);

/** What a share URL points at. */
export type ShareUrlType =
  'daily' | 'puzzle' | 'levels' | 'play' | 'enter' | 'techniques' | 'technique';

export interface ShareUrlParams {
  type: ShareUrlType;
  /** 81-char original puzzle string (`puzzle`) */
  original?: string;
  /** 81-char user input string (`puzzle`) */
  user?: string;
  /** Comma-separated pencilmarks string, 81 cells, 80 commas (`puzzle`) */
  pencilmarks?: string;
  /** Whether auto-pencilmarks are enabled (`puzzle`) */
  autopencilmarks?: boolean;
  /** Difficulty level, 1-based (`puzzle`, `play`) */
  level?: number;
  /** Hint step index, 0-based. Only included when a hint is active (`puzzle`, `technique`). */
  hint?: number;
  /** Technique path, API or canonical; shared as the canonical slug (`technique`) */
  path?: string;
  /** Base domain (default: https://sudojo.com) */
  domain?: string;
}

export interface ParsedShareParams {
  original: string;
  /** Player input; 81 zeros when the URL has none (a bare puzzle share). */
  user: string;
  pencilmarks: string;
  autopencilmarks: boolean;
  level?: number;
  hint?: number;
}

/** Query values from URLSearchParams or a plain object (RN route params). */
export type ShareParamsSource =
  URLSearchParams | Record<string, string | null | undefined>;

function buildPuzzleUrl(domain: string, params: ShareUrlParams): string {
  const searchParams = new URLSearchParams();
  if (params.level != null) {
    searchParams.set('level', String(params.level));
  }
  if (params.original) {
    searchParams.set('original', params.original);
  }
  if (params.user) {
    searchParams.set('user', params.user);
  }
  if (params.autopencilmarks != null) {
    searchParams.set('autopencilmarks', String(params.autopencilmarks));
  }

  let url = `${domain}/play/puzzle?${searchParams.toString()}`;

  // Append pencilmarks raw (commas don't need encoding in URLs)
  if (params.pencilmarks != null) {
    url += `&pencilmarks=${params.pencilmarks}`;
  }
  // Append hint step
  if (params.hint != null) {
    url += `&hint=${params.hint}`;
  }

  return url;
}

/**
 * Build a share URL. See the table at the top of this file for each type.
 *
 * For `puzzle`, pencilmarks are appended directly to the URL (without
 * URLSearchParams encoding) so commas remain as literal commas.
 */
export function buildShareUrl(params: ShareUrlParams): string {
  const domain = params.domain ?? DEFAULT_DOMAIN;

  switch (params.type) {
    case 'daily':
      return `${domain}/play/daily`;
    case 'levels':
      return `${domain}/play`;
    case 'play':
      return params.level != null
        ? `${domain}/play/${params.level}`
        : `${domain}/play`;
    case 'enter':
      return `${domain}/play/enter`;
    case 'techniques':
      return `${domain}/techniques`;
    case 'technique': {
      const slug = toCanonicalTechniquePath(params.path);
      if (!slug) return `${domain}/techniques`;
      const hint = params.hint != null ? `?hint=${params.hint}` : '';
      return `${domain}/techniques/${encodeURIComponent(slug)}${hint}`;
    }
    case 'puzzle':
      return buildPuzzleUrl(domain, params);
  }
}

function readParam(source: ShareParamsSource, name: string): string | null {
  if (source instanceof URLSearchParams) return source.get(name);
  return source[name] ?? null;
}

/**
 * Parse share URL query parameters into game state.
 *
 * Accepts URLSearchParams (web) or a plain object of strings (RN route
 * params). Returns null if `original` is missing. A missing `user` (a bare
 * puzzle share, e.g. a freshly entered puzzle) becomes 81 zeros.
 * `level` is kept only when it is a valid level (1-12); `hint` only when it
 * is a non-negative integer. When `level` is absent, callers fall back to the
 * level the solver rates the puzzle at (`parsed.level ?? validatedLevel`).
 */
export function parseShareParams(
  params: ShareParamsSource
): ParsedShareParams | null {
  const original = readParam(params, 'original');

  if (!original) {
    return null;
  }

  const levelStr = readParam(params, 'level');
  const hintStr = readParam(params, 'hint');

  const result: ParsedShareParams = {
    original,
    user: readParam(params, 'user') || EMPTY_INPUT,
    pencilmarks: readParam(params, 'pencilmarks') ?? '',
    autopencilmarks: readParam(params, 'autopencilmarks') === 'true',
  };
  if (levelStr) {
    const level = Number(levelStr);
    if (isValidLevel(level)) {
      result.level = level;
    }
  }
  if (hintStr) {
    const hintNum = Number(hintStr);
    if (Number.isInteger(hintNum) && hintNum >= 0) {
      result.hint = hintNum;
    }
  }
  return result;
}

/**
 * Derive the web app URL from an API base URL.
 *
 * - Localhost: kept as-is (web app and API share the same server in dev)
 * - Production: strips the `api.` subdomain
 *   (e.g. `https://api.sudojo.com` → `https://sudojo.com`)
 *
 * Built from the URL's parts rather than by assigning `url.hostname`: React
 * Native's `URL` has no setters, and the assignment did nothing there, so
 * every share link from the app pointed at the API (`https://api.sudojo.com/play`).
 */
export function getWebUrl(apiBaseUrl: string): string {
  try {
    const url = new URL(apiBaseUrl);
    const host =
      url.hostname !== 'localhost' && url.hostname.startsWith('api.')
        ? url.hostname.slice('api.'.length)
        : url.hostname;
    return `${url.protocol}//${host}${url.port ? `:${url.port}` : ''}`;
  } catch {
    return DEFAULT_DOMAIN;
  }
}
