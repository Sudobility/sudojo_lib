/**
 * Game state types for Sudojo
 */

/**
 * Represents a single cell in the Sudoku grid
 */
export interface CellState {
  /** Row index (0-8) */
  row: number;
  /** Column index (0-8) */
  column: number;
  /** The current value (1-9) or null if empty */
  value: number | null;
  /** Whether this cell is an original clue (cannot be modified) */
  isClue: boolean;
  /** Whether this cell has an error (wrong value) */
  isError: boolean;
  /** Pencilmarks (candidate digits) for this cell */
  pencilmarks: Set<number>;
  /** Whether this cell is currently selected */
  isSelected: boolean;
  /** Whether this cell is highlighted (same row/col/block as selected) */
  isHighlighted: boolean;
  /** Whether this cell has the same value as selected cell */
  isSameValue: boolean;
}

/**
 * A 9x9 grid of cells
 */
export type GameBoard = CellState[][];

/**
 * A single move in the game (for undo/redo)
 */
export interface GameMove {
  /** The row of the cell */
  row: number;
  /** The column of the cell */
  column: number;
  /** Previous value (null if was empty) */
  previousValue: number | null;
  /** New value (null if cleared) */
  newValue: number | null;
  /** Previous pencilmarks */
  previousPencilmarks: Set<number>;
  /** New pencilmarks */
  newPencilmarks: Set<number>;
  /** Type of move */
  type: 'value' | 'pencilmark';
}

/**
 * Game settings
 */
export interface GameSettings {
  /** Whether to highlight errors immediately */
  showErrors: boolean;
  /** Whether to highlight same numbers */
  highlightSameNumbers: boolean;
  /** Whether to highlight related cells (same row/col/block) */
  highlightRelatedCells: boolean;
  /** Whether to auto-remove pencilmarks when placing a value */
  autoRemovePencilmarks: boolean;
  /** Whether to use auto pencilmarks */
  autoPencilmarks: boolean;
}

/**
 * Default game settings
 */
export const DEFAULT_GAME_SETTINGS: GameSettings = {
  showErrors: true,
  highlightSameNumbers: true,
  highlightRelatedCells: true,
  autoRemovePencilmarks: true,
  autoPencilmarks: false,
};

/**
 * Game status
 */
export type GameStatus =
  'idle' | 'entering' | 'playing' | 'paused' | 'completed' | 'failed';

/**
 * The complete game state
 */
export interface GameState {
  /** The current board state */
  board: GameBoard;
  /** The original puzzle string (81 chars) */
  originalPuzzle: string;
  /** The solution string (81 chars) */
  solution: string;
  /** The scrambled puzzle string (81 chars) */
  scrambledPuzzle: string;
  /** The scrambled solution string (81 chars) */
  scrambledSolution: string;
  /** Scramble mapping for digits (original -> scrambled) */
  digitMapping: Map<number, number>;
  /** Undo stack */
  undoStack: GameMove[];
  /** Redo stack */
  redoStack: GameMove[];
  /** Currently selected cell position */
  selectedCell: { row: number; column: number } | null;
  /** Game settings */
  settings: GameSettings;
  /** Current game status */
  status: GameStatus;
  /** Number of mistakes made */
  mistakeCount: number;
  /** Maximum mistakes allowed (0 = unlimited) */
  maxMistakes: number;
  /** Time elapsed in seconds */
  elapsedTime: number;
  /** Whether hint mode is active */
  hintMode: boolean;
  /** Board UUID (if loaded from server) */
  boardUuid: string | null;
  /** Level UUID (if associated with a level) */
  levelUuid: string | null;
  /** Whether in board entering mode (entering original puzzle) */
  entering: boolean;
  /** Error message (e.g., validation error during enter mode) */
  errorMessage: string | null;
}

/**
 * Position in the grid
 */
export interface CellPosition {
  row: number;
  column: number;
}

/**
 * Hint information from the solver
 */
export interface GameHint {
  /** Technique name */
  title: string;
  /** Explanation text */
  text: string;
  /** Cells involved in this hint */
  cells: Array<{
    row: number;
    column: number;
    color: string;
    action?: {
      select?: number;
      addPencilmarks?: number[];
      removePencilmarks?: number[];
    };
  }>;
  /** Areas involved (rows, columns, blocks) */
  areas: Array<{
    type: 'row' | 'column' | 'block';
    index: number;
    color: string;
  }>;
}

/**
 * Teaching state for step-by-step solving
 */
export interface TeachingState {
  /** Whether teaching mode is active */
  isActive: boolean;
  /** Current hint being shown */
  currentHint: GameHint | null;
  /** Index of current step in multi-step hint */
  currentStep: number;
  /** Total number of steps in current hint */
  totalSteps: number;
  /** Whether loading hints */
  isLoading: boolean;
  /** Error message if hint loading failed */
  error: string | null;
}
