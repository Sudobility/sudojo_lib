/**
 * Single-board technique extraction: walk one board to completion with
 * repeated /solve calls, accumulating the techniques bitmask and max level,
 * or stop early when a wanted technique shows up.
 *
 * The step logic is pure; `extractBoardTechniques` is the loop and takes the
 * solve call as a function, so it works with any transport (the hooks pass a
 * `useSolverSolveMutation` call).
 *
 * Ported from `sudojo_app/src/utils/admin/SingleBoardExtractor.ts`.
 */

import {
  type BaseResponse,
  EMPTY_BOARD,
  hasPencilmarkContent,
  type SolveData,
  type SolveOptions,
  type SolverBoard,
  type SolverHints,
  type TechniqueId,
  techniqueIdsToBitmask,
} from '@sudobility/sudojo_types';
import {
  errorMessage,
  hasInvalidPencilmarksStep,
  isPuzzleFilled,
} from './boardStrings';

/** Give up on a board after this many /solve steps. */
export const MAX_EXTRACTION_ITERATIONS = 200;

/** Techniques and level found by walking a board to the end. */
export interface BoardExtractionResult {
  /** Exact techniques bitmask (bit N = technique N); can exceed 2^53 */
  readonly techniques: bigint;
  readonly level: number;
}

/** Extraction stopped with an error (e.g. invalid pencilmarks). */
export interface BoardExtractionError {
  readonly error: string;
}

/** The wanted technique was reached; the board state where it applies. */
export interface TechniqueExampleFound {
  readonly type: 'found';
  /** Solver-filled cells only (no givens); merge with the original board. */
  readonly userInput: string;
  readonly pencilmarks: string;
  readonly techniqueId: TechniqueId;
  /** Full `SolverHints` for the step, all steps included */
  readonly hintData: SolverHints;
}

export type BoardExtractionOutcome =
  BoardExtractionResult | TechniqueExampleFound | BoardExtractionError;

/** Board state carried between /solve steps. */
export interface ExtractionState {
  readonly userInput: string;
  readonly pencilmarks: string;
  readonly autoPencilmarks: boolean;
  readonly techniquesBitfield: bigint;
  readonly maxLevel: number;
}

/** One step's outcome: a new state, a find, an error, or null (no progress). */
export type ExtractionStepOutcome =
  ExtractionState | TechniqueExampleFound | BoardExtractionError | null;

/** Type guards for the outcome unions. */
export const isExtractionError = (
  value: BoardExtractionOutcome | ExtractionStepOutcome
): value is BoardExtractionError => value !== null && 'error' in value;

export const isTechniqueFound = (
  value: BoardExtractionOutcome | ExtractionStepOutcome
): value is TechniqueExampleFound =>
  value !== null && 'type' in value && value.type === 'found';

/** Initial state: empty user grid, no pencilmarks, auto-pencilmarks off. */
export function createInitialExtractionState(): ExtractionState {
  return {
    userInput: EMPTY_BOARD,
    pencilmarks: '',
    autoPencilmarks: false,
    techniquesBitfield: 0n,
    maxLevel: 0,
  };
}

/**
 * Solve request for the current state. Pencilmarks (and the auto-pencilmark
 * flag) are only sent when the state has pencilmark content; `techniques`
 * filters the solver to the wanted technique.
 */
export function buildExtractionSolveOptions(
  original: string,
  state: ExtractionState,
  desiredTechnique?: TechniqueId
): SolveOptions {
  const hasPencilmarks =
    state.pencilmarks !== '' && hasPencilmarkContent(state.pencilmarks);
  const options: SolveOptions = {
    original,
    user: state.userInput,
    autoPencilmarks: hasPencilmarks ? state.autoPencilmarks : false,
  };
  if (hasPencilmarks) options.pencilmarks = state.pencilmarks;
  if (desiredTechnique !== undefined) {
    options.techniques = desiredTechnique.toString();
  }
  return options;
}

/**
 * Next state from a hint, or null when the solver's board did not change
 * (no progress possible). Technique 0 (auto-pencilmark / correction hints)
 * adds no bit; level 0 does not lower the max.
 */
export function computeNextExtractionState(
  state: ExtractionState,
  hints: SolverHints,
  boardData: SolverBoard | undefined | null
): ExtractionState | null {
  if (!boardData?.user) return null;

  const pencilmarks = boardData.pencilmark?.numbers ?? '';
  if (boardData.user === state.userInput && pencilmarks === state.pencilmarks) {
    return null;
  }

  return {
    userInput: boardData.user,
    pencilmarks,
    autoPencilmarks: boardData.pencilmark?.autopencil ?? false,
    techniquesBitfield:
      hints.technique > 0
        ? state.techniquesBitfield |
          techniqueIdsToBitmask([hints.technique as TechniqueId])
        : state.techniquesBitfield,
    maxLevel:
      hints.level > 0 ? Math.max(state.maxLevel, hints.level) : state.maxLevel,
  };
}

/** Final result of a state. */
export function extractionStateToResult(
  state: ExtractionState
): BoardExtractionResult {
  return { techniques: state.techniquesBitfield, level: state.maxLevel };
}

/**
 * Interpret one /solve response:
 * - no hint steps → null (no progress)
 * - an "Invalid Pencilmarks" step → error
 * - the wanted technique → `found` with the state *before* the step
 * - otherwise → the next state (null when the board did not change)
 */
export function interpretSolveResponse(
  response: BaseResponse<SolveData>,
  state: ExtractionState,
  desiredTechnique?: TechniqueId
): ExtractionStepOutcome {
  const hints = response.data?.hints;
  if (!response.success || !hints?.steps?.length) return null;

  if (hasInvalidPencilmarksStep(hints.steps)) {
    return { error: 'Invalid pencilmarks detected' };
  }

  if (
    desiredTechnique !== undefined &&
    hints.technique > 0 &&
    hints.technique === desiredTechnique
  ) {
    return {
      type: 'found',
      userInput: state.userInput,
      pencilmarks: state.pencilmarks,
      techniqueId: desiredTechnique,
      hintData: hints,
    };
  }

  return computeNextExtractionState(state, hints, response.data?.board);
}

/**
 * A thrown /solve call: messages containing "Invalid" or "400" are errors,
 * anything else (network, timeout) counts as no progress.
 */
export function interpretSolveError(err: unknown): BoardExtractionError | null {
  const message = errorMessage(err);
  if (message.includes('Invalid') || message.includes('400')) {
    return { error: message };
  }
  return null;
}

/** Performs one /solve call. */
export type SolveFn = (
  options: SolveOptions
) => Promise<BaseResponse<SolveData>>;

/**
 * Walk `original` with /solve until it is filled or stuck. With
 * `desiredTechnique`, the solver is filtered to it and the first matching
 * hint returns `found`. Returns an error after
 * {@link MAX_EXTRACTION_ITERATIONS} steps.
 */
export async function extractBoardTechniques(
  solve: SolveFn,
  original: string,
  desiredTechnique?: TechniqueId
): Promise<BoardExtractionOutcome> {
  let state = createInitialExtractionState();

  for (let i = 0; i < MAX_EXTRACTION_ITERATIONS; i++) {
    if (isPuzzleFilled(original, state.userInput)) {
      return extractionStateToResult(state);
    }

    let step: ExtractionStepOutcome;
    try {
      const response = await solve(
        buildExtractionSolveOptions(original, state, desiredTechnique)
      );
      step = interpretSolveResponse(response, state, desiredTechnique);
    } catch (err) {
      step = interpretSolveError(err);
    }

    if (step === null) return extractionStateToResult(state);
    if (isExtractionError(step) || isTechniqueFound(step)) return step;
    state = step;
  }

  return { error: 'Max iterations exceeded' };
}
