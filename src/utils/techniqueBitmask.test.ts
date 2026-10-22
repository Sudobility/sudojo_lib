/**
 * Tests for exact technique bitmask utilities
 */

import { describe, expect, it } from 'vitest';
import {
  exactTechniqueBitmask,
  techniqueBitmaskString,
  techniqueFieldsOf,
} from './techniqueBitmask';

// Bit 60 + bit 1. As a JS number this rounds and loses bit 1.
const MASK = '1152921504606846978';
const LOSSY = Number(MASK);

describe('exactTechniqueBitmask', () => {
  it('prefers the exact string over the lossy number', () => {
    expect(
      exactTechniqueBitmask({ techniques: LOSSY, techniques_bitmask: MASK })
    ).toBe(BigInt(MASK));
  });

  it('falls back to the number for older API responses', () => {
    expect(exactTechniqueBitmask({ techniques: 6 })).toBe(6n);
  });

  it('treats missing values as 0n', () => {
    expect(exactTechniqueBitmask(null)).toBe(0n);
    expect(exactTechniqueBitmask(undefined)).toBe(0n);
    expect(
      exactTechniqueBitmask({ techniques: null, techniques_bitmask: null })
    ).toBe(0n);
  });

  it('never throws: a malformed string falls back to the number, then to 0n', () => {
    expect(
      exactTechniqueBitmask({ techniques: 6, techniques_bitmask: 'abc' })
    ).toBe(6n);
    expect(
      exactTechniqueBitmask({ techniques: -1, techniques_bitmask: '1e3' })
    ).toBe(0n);
  });
});

describe('techniqueBitmaskString', () => {
  it('formats the exact bitmask for requests', () => {
    expect(
      techniqueBitmaskString({ techniques: LOSSY, techniques_bitmask: MASK })
    ).toBe(MASK);
    expect(techniqueBitmaskString({ techniques: null })).toBe('0');
  });

  it('preserves a 128-bit mask through game metadata', () => {
    const mask = ((1n << 127n) | 2n).toString();
    const fields = techniqueFieldsOf({
      techniques: 2,
      techniques_bitmask: mask,
    });
    const restored = JSON.parse(JSON.stringify(fields));
    expect(exactTechniqueBitmask(restored)).toBe(BigInt(mask));
    expect(techniqueBitmaskString(restored)).toBe(mask);
  });
});

describe('techniqueFieldsOf', () => {
  it('keeps the numeric field and adds the exact string', () => {
    expect(
      techniqueFieldsOf({ techniques: LOSSY, techniques_bitmask: MASK })
    ).toEqual({ techniques: LOSSY, techniques_bitmask: MASK });
  });

  it('survives a JSON round trip (persisted game meta)', () => {
    const meta = JSON.parse(
      JSON.stringify(
        techniqueFieldsOf({ techniques: LOSSY, techniques_bitmask: MASK })
      )
    );
    expect(techniqueFieldsOf(meta).techniques_bitmask).toBe(MASK);
    expect(exactTechniqueBitmask(meta)).toBe(BigInt(MASK));
  });

  it('upgrades legacy meta that only has the number', () => {
    expect(techniqueFieldsOf({ techniques: 6 })).toEqual({
      techniques: 6,
      techniques_bitmask: '6',
    });
  });

  it('returns nulls when there is no bitmask at all', () => {
    expect(techniqueFieldsOf({})).toEqual({
      techniques: null,
      techniques_bitmask: null,
    });
    expect(techniqueFieldsOf(null)).toEqual({
      techniques: null,
      techniques_bitmask: null,
    });
  });
});
