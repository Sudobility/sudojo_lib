/**
 * @sudobility/sudojo_lib - Business logic library for Sudojo app
 *
 * This library provides:
 * - Game state management with useSudoku hook (ported from renderable)
 * - Board scrambling utilities
 * - Game validation (mistakes, completion)
 * - Level, technique, and learning data hooks
 * - Teaching/hint integration with solver
 * - Legacy useGame hook for backward compatibility
 *
 * ## Hook Architecture
 *
 * The hooks form a layered composition pattern:
 *
 * **Data hooks** (fetch and cache server data):
 * - `useLevels` / `useLevel` - Difficulty level data
 * - `useTechniques` / `useTechnique` - Solving technique data
 * - `useLearning` / `useLearningItem` - Learning material data
 *
 * **Game fetching hooks** (handle auth, subscription, and puzzle loading):
 * - `useLevelGame` - Fetch a random board for a specific level
 * - `useDailyGame` - Fetch today's daily puzzle
 *
 * **Game state hooks** (manage board state and user interaction):
 * - `useSudoku` - Primary game state (flat 81-cell array, modern API)
 * - `useGame` - Legacy game state (2D array, deprecated)
 * - `useBoardEntry` - Manual puzzle entry mode
 * - `useBoardScan` - Read givens, player digits and pencilmarks from a photo
 *
 * **Feature hooks** (provide specific game features):
 * - `useHint` - Solver integration for hints (matches Kotlin HintInteractor)
 * - `useGameTeaching` - Step-by-step teaching with solver
 * - `useGameTimer` - Elapsed time tracking via ref (no re-renders)
 * - `useGamePersistence` / `useAutoSave` - localStorage game save/restore
 * - `useLocalStorage` - Generic typed localStorage hook
 *
 * **Orchestration hooks** (combine multiple hooks for app-level features):
 * - `useGamePlay` - Current game management with Zustand store (daily/play slots)
 * - `useGameSession` - Server-side gamification (start/finish, points, badges)
 *
 * ## Migration Guide
 *
 * Legacy exports (prefixed with "Legacy" comments) use the 2D `GameBoard` type
 * from `useGame`. New code should use `useSudoku` with its flat 81-cell
 * `SudokuBoard` type. See `@deprecated` tags on legacy exports.
 */

// ============================================================================
// Legacy Types (useGame hook)
// ============================================================================

/**
 * @deprecated Use `SudokuCell` instead. Part of the legacy `useGame` 2D board API.
 */
export type {
  CellPosition,
  CellState,
  GameBoard,
  GameHint,
  GameMove,
  GameSettings,
  GameState,
  GameStatus,
  TeachingState,
} from './types';

/** @deprecated Use `DEFAULT_APP_SETTINGS` / `DEFAULT_PLAY_SETTINGS` instead. */
export { DEFAULT_GAME_SETTINGS } from './types';

// ============================================================================
// Sudoku Types (useSudoku hook - ported from renderable)
// ============================================================================

/** Core Sudoku cell and board types using flat 81-cell array representation. */
export type {
  /** A single cell in the Sudoku board (indexed 0-80). */
  SudokuCell,
  /** The Sudoku board containing all 81 cells. */
  SudokuBoard,
  /** Current play state including board, settings, and selection. */
  SudokuPlay,
  /** Session settings that can change during play (pencilmarking, auto-pencilmarks). */
  SudokuPlaySettings,
  /** App-level settings persisted across sessions (showErrors, display format). */
  SudokuAppSettings,
  /** Full game state including source, history, and digit mapping. */
  SudokuGameState,
  /** Display modes for Sudoku digits ('NUMERIC' | 'KANJI' | 'COLORS' | 'EMOJIS'). */
  SudokuDisplay,
  /** Source of the puzzle ('DAILY' | 'CHALLENGE' | 'LEVEL' | 'ENTERED'). */
  PlayingSource,
} from './types';

/** Default settings and cell/board helper functions for the modern Sudoku API. */
export {
  /** Default session play settings (pencilmarking off, auto-pencilmarks off). */
  DEFAULT_PLAY_SETTINGS,
  /** Default app settings (showErrors on, animations on, numeric display). */
  DEFAULT_APP_SETTINGS,
  /** Create an empty SudokuCell at the given index. */
  createEmptyCell,
  /** Create an empty 81-cell SudokuBoard. */
  createEmptyBoard,
  /** Check if a cell has an error (input does not match solution). */
  cellHasError,
  /** Get row index (0-8) from cell index (0-80). */
  rowOf,
  /** Get column index (0-8) from cell index (0-80). */
  columnOf,
  /** Get block index (0-8) from cell index (0-80). */
  blockOf,
  /** Get cell index (0-80) from row and column. */
  cellIndex,
  /** Get all cell indices in the same row as the given index. */
  getRowIndices,
  /** Get all cell indices in the same column as the given index. */
  getColumnIndices,
  /** Get all cell indices in the same block as the given index. */
  getBlockIndices,
  /** Get all related cell indices (same row, column, or block) excluding the cell itself. */
  getRelatedIndices,
} from './types';

// ============================================================================
// Display types (for rendering - matches Kotlin renderable)
// ============================================================================

/** Display and hint visualization types matching the Kotlin renderable layer. */
export type {
  /** Highlighted area in a hint (row, column, or block). */
  HintArea,
  /** Cell display information in a hint step. */
  HintCell,
  /** Actions to perform on a cell during hint visualization. */
  HintCellActions,
  /** A single hint step with title, text, areas, cells, links, and groups. */
  DisplayHintStep,
  /** Complete display state for a single cell (colors, digit, pencilmarks). */
  CellDisplayState,
  /** Display state for a single pencilmark (digit and color). */
  PencilmarkDisplayState,
  /** UI color palette with system colors for light or dark mode. */
  UIColorPalette,
  /** Link type for chain visualization ('strong' | 'weak'). */
  LinkType,
  /** A link between two cells in a chain (display format). */
  DisplayLink,
  /** A group of cells for pattern visualization (display format). */
  DisplayCellGroup,
} from './types';

/** Theme and color enums plus predefined light/dark palettes. */
export { ThemeColor, SudokuColor, UIColorLight, UIColorDark } from './types';

// ============================================================================
// Progress Types (for user progress tracking)
// ============================================================================

/** Types for tracking user puzzle completion and statistics. */
export type {
  /** Record of a completed puzzle (id, type, time). */
  CompletedPuzzle,
  /** Computed game statistics (best times, averages). */
  GameStats,
  /** Full user progress data (completed puzzles, streak, stats). */
  UserProgress,
} from './types';

export {
  /** Default empty user progress state. */
  DEFAULT_PROGRESS,
  /** localStorage key for progress data ('sudojo-progress'). */
  PROGRESS_STORAGE_KEY,
} from './types';

// ============================================================================
// Settings Types (for app settings)
// ============================================================================

/** Types for application settings. */
export type {
  /** Digit display format ('numeric' | 'kanji' | 'emojis'). */
  DigitDisplay,
  /** Application settings (showErrors, symmetrical, display). */
  AppSettings,
} from './types';

export {
  /** Default application settings. */
  DEFAULT_SETTINGS,
  /** localStorage key for settings ('sudojo-settings'). */
  SETTINGS_STORAGE_KEY,
} from './types';

// ============================================================================
// Subscription Types (for subscription management)
// ============================================================================

/** Types for RevenueCat subscription management. */
export type {
  /** Subscription product information (price, period, trial). */
  Product,
  /** User subscription status (active, expiration, renewal). */
  Subscription,
} from './types';

/** Default inactive subscription state. */
export { DEFAULT_SUBSCRIPTION } from './types';

// ============================================================================
// Game Persistence Types (for saving/loading game state)
// ============================================================================

/** Types for saving and restoring game progress to localStorage. */
export type {
  /** Saved game state (input, pencilmarks, mode, timestamp). */
  SavedGameState,
  /** Key identifying a game to persist (type + id). */
  GamePersistenceKey,
} from './types';

export {
  /** localStorage key prefix for game saves ('sudojo_game_'). */
  GAME_STORAGE_PREFIX,
  /** Generate a localStorage key from a GamePersistenceKey. */
  getGameStorageKey,
} from './types';

// ============================================================================
// Current Game Types (for current game feature)
// ============================================================================

/** Types for the Zustand-backed current game store. */
export type {
  /** Source of the current game ('daily' | 'level' | 'entered'). */
  GameSource,
  /** Navigation metadata for resuming a game (date, level, board info). */
  CurrentGameMeta,
  /** Full current game state stored in Zustand (puzzle, progress, timing). */
  CurrentGame,
  /** Which store slot a game lives in ('daily' | 'play'). */
  GameSlot,
} from './types';

// ============================================================================
// Legacy Utilities (useGame hook)
// ============================================================================

/**
 * @deprecated These utilities work with the legacy 2D `GameBoard` type.
 * For new code, use `useSudoku` with its flat 81-cell board and the
 * scrambler/presenter utilities below.
 */
export {
  /** @deprecated Clone a 2D GameBoard. Use useSudoku's immutable state instead. */
  cloneBoard,
  /** @deprecated Count filled cells in a 2D GameBoard. */
  countFilledCells,
  /** @deprecated Create a 2D GameBoard from puzzle/solution strings. */
  createGameBoard,
  /** @deprecated Get cells in a block by block index (2D API). */
  getBlockCells,
  /** @deprecated Get block index from row/col (2D API). Use blockOf() instead. */
  getBlockIndex,
  /** @deprecated Get 2D board state as string. Use cellsToStateString() instead. */
  getBoardStateString,
  /** @deprecated Get cells in a column (2D API). Use getColumnIndices() instead. */
  getColumnCells,
  /** @deprecated Get empty cells from a 2D GameBoard. */
  getEmptyCells,
  /** @deprecated Get pencilmarks string from 2D GameBoard. Use cellsToPencilmarksString() instead. */
  getPencilmarksString,
  /** @deprecated Get related cells (2D API). Use getRelatedIndices() instead. */
  getRelatedCells,
  /** @deprecated Get cells in a row (2D API). Use getRowIndices() instead. */
  getRowCells,
  /** @deprecated Check if placement is valid (2D API). */
  isValidPlacement,
  /** @deprecated Auto-remove pencilmarks (2D API). useSudoku handles this internally. */
  autoRemovePencilmarks,
  /** @deprecated Clear highlights (2D API). useSudoku handles this via presentBoard(). */
  clearHighlights,
  /** @deprecated Count mistakes (2D API). Use useSudoku's errorCount instead. */
  countMistakes,
  /** @deprecated Get incorrect cells (2D API). Use useSudoku's errorCells instead. */
  getIncorrectCells,
  /** @deprecated Get progress percentage (2D API). Use useSudoku's progress instead. */
  getProgressPercentage,
  /** @deprecated Check if board is filled (2D API). */
  isBoardFilled,
  /** @deprecated Check if cell is correct (2D API). Use cellHasError() instead. */
  isCellCorrect,
  /** @deprecated Check if game is complete (2D API). Use useSudoku's isCompleted instead. */
  isGameComplete,
  /** @deprecated Check if value is correct (2D API). */
  isValueCorrect,
  /** @deprecated Update cell errors (2D API). useSudoku handles this automatically. */
  updateCellErrors,
  /** @deprecated Update cell highlights (2D API). Use presentBoard() instead. */
  updateCellHighlights,
  /** @deprecated Validate entire game state (2D API). */
  validateGameState,
} from './utils';

// ============================================================================
// Sudoku Utilities (useSudoku hook - ported from renderable)
// ============================================================================

/** Types for board scrambling. */
export type {
  /** Protocol for board scramblers (Scrambler and NonScrambler implement this). */
  ScramblerProtocol,
  /** Result of scrambling a board (cells + digit mappings). */
  SudokuScrambleResult,
} from './utils';

/** Board scrambling and puzzle string conversion utilities. */
export {
  /** Scrambler that permutes rows, columns, and digits to create unique puzzles. */
  Scrambler,
  /** Identity scrambler that returns the board unchanged. */
  NonScrambler,
  /** Scramble a board using a ScramblerProtocol implementation. */
  scrambleSudokuBoard,
  /** Parse an 81-character puzzle string into SudokuCell array. */
  parsePuzzleString,
  /** Convert SudokuCell array to puzzle string (given values only). */
  cellsToPuzzleString,
  /** Convert SudokuCell array to state string (given + input values). */
  cellsToStateString,
  /** Convert SudokuCell array to input-only string. */
  cellsToInputString,
  /** Convert SudokuCell array to comma-separated pencilmarks string. */
  cellsToPencilmarksString,
  /** Convert SudokuCell array to solution string ('0' where unknown). */
  cellsToSolutionString,
  /** Count the givens (clues) in a SudokuCell array. */
  countClues,
} from './utils';

/** Board and level constants from sudojo_types, re-exported for convenience. */
export {
  /** Fewest givens a valid Sudoku can have (17). */
  MIN_CLUES,
  /** Lowest difficulty level (1). */
  MIN_LEVEL,
  /** Highest difficulty level (12). */
  MAX_LEVEL,
  /** Whether a value is an integer level in MIN_LEVEL..MAX_LEVEL. */
  isValidLevel,
  /** All levels, MIN_LEVEL..MAX_LEVEL. */
  ALL_LEVELS,
} from '@sudobility/sudojo_types';

// ============================================================================
// Presenter utilities (for rendering - matches Kotlin renderable)
// ============================================================================

/** Options type for the presentBoard function. */
export type {
  /** Options for generating cell display states (cells, selection, errors, hints). */
  PresentBoardOptions,
} from './utils';

/** Board presentation and color utilities matching the Kotlin renderable layer. */
export {
  /** Generate display states for all 81 cells (colors, digits, pencilmarks, hints). */
  presentBoard,
  /** Process hint step areas and cells into a map of cell hints by index. */
  calculateCellHints,
  /** Convert a ThemeColor to an actual CSS color string using a palette. */
  themeColorToCSS,
  /** Get the UIColorPalette for light or dark mode. */
  getColorPalette,
  /** Get indices of cells containing a specific digit (given or input). */
  getCellsWithDigit,
  /** Get the digit to highlight based on the selected cell (given or correct input). */
  getSelectedDigit,
  /** Compute the set of cell indices with the same digit as the selected cell. */
  computeSelectedDigitCells,
  /** Convert a solver link (row/col pairs) to display format (flat indices). */
  convertSolverLink,
  /** Convert a solver cell group to display format with ThemeColor. */
  convertSolverCellGroup,
  /** Convert SudokuColor enum to ThemeColor enum. */
  sudokuColorToTheme,
  /** Map a solver color string to SudokuColor (case-insensitive; unknown → null). */
  solverColorToSudokuColor,
  /** Parse a solver digit string ("125") into digits 1-9. */
  parseHintDigits,
  /** Convert a SolverHintStep into the DisplayHintStep presentBoard takes. */
  convertSolverHintStep,
  /** Whether a hint step is a conflict hint (has a 'conflict' link). */
  isConflictHintStep,
} from './utils';

// ============================================================================
// Time Utilities
// ============================================================================

/** Time formatting and parsing utilities. */
export {
  /** Format seconds into MM:SS or HH:MM:SS string. */
  formatTime,
  /** Parse a MM:SS or HH:MM:SS string back to total seconds. */
  parseTime,
} from './utils';

// ============================================================================
// Progress Utilities
// ============================================================================

/** User progress calculation utilities. */
export {
  /** Calculate game statistics (best times, averages) from completed puzzles. */
  calculateStats,
  /** Calculate current daily streak from completion history. */
  calculateStreak,
  /** Check if a specific puzzle (by type and id) has been completed. */
  isPuzzleCompleted,
  /** Get all completed level IDs from completion history. */
  getCompletedLevelIds,
  /** Get all completed daily dates (YYYY-MM-DD) from completion history. */
  getCompletedDailyDates,
  /** Record a puzzle completion in UserProgress (pure markCompleted reducer). */
  applyPuzzleCompletion,
} from './utils';

/** A puzzle completion to record (CompletedPuzzle without completedAt). */
export type { PuzzleCompletion } from './utils';

// ============================================================================
// Theme Utilities
// ============================================================================

/** Types for theme preference management. */
export type {
  /** Theme preference: 'light' | 'dark' | 'system'. */
  ThemePreference,
  /** Resolved theme without system option: 'light' | 'dark'. */
  ResolvedTheme,
} from './utils';

/** Theme detection and resolution utilities. */
export {
  /** localStorage key for theme preference ('sudojo-theme'). */
  THEME_STORAGE_KEY,
  /** localStorage key for font size preference ('sudojo-font-size'). */
  FONT_SIZE_STORAGE_KEY,
  /** Detect the system color scheme preference (light/dark). */
  getSystemTheme,
  /** Resolve a ThemePreference to an actual theme using the system theme. */
  resolveTheme,
  /** Type guard: check if a value is a valid ThemePreference. */
  isValidThemePreference,
} from './utils';

// ============================================================================
// Subscription Utilities
// ============================================================================

/** RevenueCat subscription conversion and display utilities. */
export {
  /** Convert a RevenueCat package to a Product domain model. */
  convertPackageToProduct,
  /** Parse RevenueCat CustomerInfo into a Subscription domain model. */
  parseCustomerInfo,
  /** Get human-readable name for an ISO 8601 subscription period (e.g., 'P1M' -> 'Monthly'). */
  getPeriodDisplayName,
  /** Check if a subscription period is the "best value" option (annual plans). */
  isBestValuePlan,
  /** Get a user-friendly error message for a RevenueCat error code. */
  getRevenueCatErrorMessage,
  /** i18n key for a period's unit (e.g. 'P1M' -> 'periods.month'), or null. */
  getPeriodLabelKey,
  /** Localized price suffix for a period (e.g. '/month'), or ''. */
  getPeriodLabel,
  /** Whether a product is the best-value plan (annual period or annual/yearly id). */
  isBestValueProduct,
  /** Months in a subscription period (named or ISO 8601), or null. */
  subscriptionPeriodToMonths,
  /** Percent saved per month by one plan versus another, or null. */
  calculateSavingsPercent,
  /** Whether a subscription was bought on another platform than this client. */
  isCrossPlatformSubscription,
  /** Whether the account can be deleted now (signed in, not anonymous, no active subscription). */
  canDeleteAccount,
  /** Fraction (0-1) of puzzles an offer unlocks, from the levels' percentages. */
  getPuzzleDistribution,
  /** The plan the savings badge compares with (shortest known period), or null. */
  selectSavingsBasePlan,
  /** Percent a plan saves per month against the products' savings base plan, or null. */
  getPlanSavingsPercent,
} from './utils';

/** Types for subscription display and account deletion helpers. */
export type {
  /** Price and period of a plan (for calculateSavingsPercent). */
  PricedPeriod,
  /** A paywall plan (price as number or string, period). */
  PaywallPlan,
  /** Why an account cannot be deleted ('not_signed_in' | 'anonymous' | 'active_subscription'). */
  DeleteAccountBlocker,
  /** Result of canDeleteAccount. */
  DeleteAccountCheck,
} from './utils';

// ============================================================================
// Technique Utilities
// ============================================================================

/** Types for technique and strategy utilities. */
export type {
  /** A public technique slug (member of TECHNIQUE_SLUGS). */
  TechniqueSlug,
  /** A strategy stub (member of STRATEGY_SLUGS). */
  StrategySlug,
  /** Strategy difficulty tier ('beginner' ... 'master'). */
  StrategyDifficultyTier,
  /** One localized section of a strategy description. */
  StrategySection,
  /** A technique's localized overview, steps and tips. */
  TechniqueContent,
} from './utils';

/** Technique and strategy utilities. */
export {
  /** Get the icon URL for a solving technique by its path slug. */
  getTechniqueIconUrl,
  /** Public slug for a technique path ('3d-medusa' -> 'medusa-coloring'). */
  toCanonicalTechniquePath,
  /** API path for a technique slug ('medusa-coloring' -> '3d-medusa'). */
  toApiTechniquePath,
  /** Whether two technique paths name the same technique, aliases included. */
  isSameTechniquePath,
  /** Find a technique by API path or canonical slug. */
  findTechniqueByPath,
  /** Parse a comma-separated dependencies field into technique ids. */
  parseTechniqueDependencies,
  /** Techniques a technique depends on ("Requires"). */
  getTechniqueDependencies,
  /** Techniques that depend on a technique ("Learn after"). */
  getDependentTechniques,
  /** Sort techniques by level, then technique number. */
  sortTechniquesByLevel,
  /** Group techniques by level (Map, each group sorted by technique number). */
  groupTechniquesByLevel,
  /** Techniques of a strategy, sorted by technique number. */
  getTechniquesForStrategy,
  /** Find a strategy by its URL stub. */
  findStrategyByStub,
  /** Public slugs of all 60 techniques (footer / sitemap order). */
  TECHNIQUE_SLUGS,
  /** Stubs of the 17 strategies (difficulty order). */
  STRATEGY_SLUGS,
  /** Difficulty tier for a strategy's difficulty value. */
  getStrategyDifficultyTier,
  /** i18n key for a strategy's difficulty tier (e.g. 'strategy.expert'). */
  getStrategyDifficultyKey,
  /** Localized sections of a strategy from the strategies namespace. */
  getStrategySections,
  /** Localized overview, how-it-works steps and tips of a technique. */
  parseTechniqueContent,
} from './utils';

// ============================================================================
// Technique Bitmask Utilities
// ============================================================================

/** Exact (bigint) technique bitmasks for boards, dailies and game meta. */
export {
  /** Exact bitmask of a board/daily/meta; never throws (falls back to 0n). */
  exactTechniqueBitmask,
  /** Exact bitmask as the base-10 string API requests take. */
  techniqueBitmaskString,
  /** The techniques / techniques_bitmask pair to store on game meta. */
  techniqueFieldsOf,
} from './utils';

// ============================================================================
// Technique Walkthrough Utilities
// ============================================================================

/** A single step in a technique walkthrough (board + hint overlay + text). */
export type { WalkthroughStep } from './utils';

/** Shared logic for building step-by-step technique examples from practice data. */
export {
  /** Parse a comma-delimited pencilmarks string into per-cell arrays. */
  parsePencilmarksString,
  /** Convert per-cell pencilmarks arrays back to a comma-delimited string. */
  pencilmarksToString,
  /** Parse board/pencilmarks/solution strings into a SudokuCell array. */
  parsePracticeBoard,
  /** Deep clone a SudokuCell array. */
  cloneSudokuBoard,
  /** Apply a hint step's actions to a board, returning new state. */
  applyHintStep,
  /** Parse a hint_data JSON string into SolverHints. */
  parseHintData,
  /** Resolve localised title and text for a single hint step. */
  localizeHintStep,
  /** Build the full walkthrough step array from board and hint data. */
  buildWalkthroughSteps,
} from './utils';

// ============================================================================
// Hint Explanation Utilities
// ============================================================================

/** Hint explanation generation utilities for teaching users solving techniques. */
export {
  /** Generate a detailed explanation for a hint step based on the technique. */
  generateDetailedExplanation,
  /** Get a short action summary for a hint step (e.g., 'Place 5 in R1C3'). */
  getHintActionSummary,
} from './utils';

// ============================================================================
// Localized Hint Utilities
// ============================================================================

/** Types for hint text localization. */
export type {
  /** Translation function compatible with i18next's `t` function. */
  TranslateFunction,
  /** Nested heading tree (the `headings` object of hints.json). */
  HintHeadingTree,
  /** Text/title/heading resolvers returned by createLocalizedHintHelpers. */
  LocalizedHintHelpers,
} from './utils';

/** Hint localization utilities. */
export {
  /** Get localized text for a hint step using a translation function. */
  getLocalizedHintText,
  /** Get localized title for a hint step using a translation function. */
  getLocalizedHintTitle,
  /** Resolve a localized API field, falling back to the raw value. */
  localizedField,
  /** Key prefix of the per-step heading tree ('headings.'). */
  HINT_HEADING_KEY_PREFIX,
  /** Heading localization (headings.<path>) for a hint step, or undefined. */
  getStepHeadingLocalization,
  /** Translated heading for a hint step, or ''. */
  getLocalizedHintHeading,
  /** Fill {{valueN}} placeholders from a values array. */
  interpolateHintValues,
  /** Heading for a hint step looked up in a heading tree (no i18n library). */
  getStepHeadingFromTree,
  /** Build the text/title/heading resolvers behind the apps' useLocalizedHint. */
  createLocalizedHintHelpers,
} from './utils';

// ============================================================================
// Entity Translation Utilities
// ============================================================================

/** Shapes the entity display helpers read. */
export type {
  /** Level fields used by getLevelDisplayTitle / getLevelDisplayText. */
  LevelDisplaySource,
  /** Technique fields used by getTechniqueDisplayTitle. */
  TechniqueDisplaySource,
  /** Strategy fields used by getStrategyDisplayTitle. */
  StrategyDisplaySource,
} from './utils';

/** Translation of API entities (levels, techniques, belts). */
export {
  /** Route prefixed entity keys (levels.*, techniques.*) to their namespaces. */
  createNamespacedTranslate,
  /** Display title of a level (localization, levels namespace, raw title). */
  getLevelDisplayTitle,
  /** Display description of a level (localization, levels namespace, raw text). */
  getLevelDisplayText,
  /** Display title of a technique (localization, techniques namespace, raw title). */
  getTechniqueDisplayTitle,
  /** Localized belt name for a level ('belts' namespace `${level}.name`). */
  getBeltDisplayName,
  /** Localized belt label for a level ('belts' namespace `${level}.label`). */
  getBeltDisplayLabel,
  /** Display title of a strategy (localization, strategies namespace, raw title, stub). */
  getStrategyDisplayTitle,
} from './utils';

// ============================================================================
// i18n Key Utilities
// ============================================================================

/** Internationalization key generation and localization utilities. */
export {
  /** Get i18n key for a belt name (e.g., 'belts.1.name'). */
  getBeltKey,
  /** Get localized belt name using a translation function. */
  getLocalizedBeltName,
  /** Get i18n key for a belt label (e.g., 'belts.1.label'). */
  getBeltLabelKey,
  /** Get localized belt label (e.g., 'White Belt'). */
  getLocalizedBeltLabel,
  /** Get i18n key for a level title (e.g., 'levels.3'). */
  getLevelKey,
  /** Get localized level title using a translation function. */
  getLocalizedLevelTitle,
  /** Get i18n key for a technique name (e.g., 'techniques.full-house.title'). */
  getTechniqueKey,
  /** Get localized technique name using a translation function. */
  getLocalizedTechniqueName,
} from './utils';

// ============================================================================
// Digit Display Utilities
// ============================================================================

/** Digit display format conversion. */
export {
  /** Convert a digit (1-9) to its display string based on the format (numeric, kanji, emojis). */
  displayDigit,
} from './utils';

// ============================================================================
// Scanned Board (OCR) Utilities
// ============================================================================

/** A board read from an image, and the error a scan can fail with. */
export type { ScannedBoard, ScanBoardErrorCode } from './utils';

export {
  /** Fewest givens a scanned board needs (17). */
  MIN_SCAN_CLUES,
  /** Error thrown by scannedBoardFromResponse / useBoardScan, with a `code`. */
  ScanBoardError,
  /** Normalize an OCR API result into givens, player digits and pencilmarks. */
  toScannedBoard,
  /** Whether a scanned board carries any player digits. */
  hasScannedInput,
  /** Turn the OCR endpoint's response into a ScannedBoard (or throw why not). */
  scannedBoardFromResponse,
} from './utils';

// ============================================================================
// Share URL Utilities
// ============================================================================

/** Types for share URL building and parsing. */
export type {
  /** Options for buildShareUrl. */
  ShareUrlParams,
  /** Game state parsed from a puzzle share URL. */
  ParsedShareParams,
  /** What a share URL points at ('daily' | 'puzzle' | 'technique' | ...). */
  ShareUrlType,
  /** URLSearchParams or a plain object of route params. */
  ShareParamsSource,
} from './utils';

/** Build a share URL from game state. */
export { buildShareUrl } from './utils';

/** Parse share URL query parameters into game state. */
export { parseShareParams } from './utils';

/** Derive web app URL from API base URL. */
export { getWebUrl } from './utils';

// ============================================================================
// Auth Utilities
// ============================================================================

/** Minimal user shape for auth checks. */
export type { AuthUser } from './utils';

/** Check if user-specific API calls should be enabled (non-anonymous, has token). */
export { isAuthenticatedUser } from './utils';

/** Whether a user is a real (signed-in, non-anonymous) account. */
export { isRealUser } from './utils';

// ============================================================================
// Language Utilities
// ============================================================================

/** Types for supported languages. */
export type {
  /** A supported language (code, native name, flag). */
  SupportedLanguageInfo,
  /** A supported language code (lowercase, e.g. 'zh-hant'). */
  SupportedLanguageCode,
} from './utils';

/** Supported languages, locale resolution and language storage keys. */
export {
  /** The 15 supported UI languages. */
  SUPPORTED_LANGUAGES,
  /** Codes of the supported languages. */
  SUPPORTED_LANGUAGE_CODES,
  /** Fallback language ('en'). */
  DEFAULT_LANGUAGE,
  /** Web localStorage key for the language preference ('language'). */
  LANGUAGE_STORAGE_KEY,
  /** RN AsyncStorage key for the language preference ('@sudojo/language'). */
  NATIVE_LANGUAGE_STORAGE_KEY,
  /** Whether a code is a supported language code. */
  isSupportedLanguage,
  /** Map a code or locale tag to a supported code (zh-TW/HK -> zh-hant), or null. */
  normalizeLanguageCode,
  /** Supported language for a locale tag, defaulting to 'en'. */
  resolveLanguage,
  /** BCP 47 casing of a code ('zh-hant' -> 'zh-Hant'). */
  toLanguageTag,
  /** Native name of a language, or undefined. */
  getLanguageNativeName,
} from './utils';

// ============================================================================
// Community Utilities
// ============================================================================

/** A known community platform (id, label key, English label). */
export type { CommunityPlatformInfo } from './utils';

/** Community platform order and labels. */
export {
  /** Known community platforms in display order. */
  COMMUNITY_PLATFORMS,
  /** Info for a platform id (case-insensitive), or undefined. */
  getCommunityPlatform,
  /** Sort platform ids into display order (unknown last). */
  sortCommunityPlatforms,
} from './utils';

// ============================================================================
// Gamification Utilities
// ============================================================================

/** Types for badge progress. */
export type {
  /** Badge definitions split into level/game lists with an earned lookup. */
  BadgeProgress,
  /** Badge definition fields groupBadgeProgress reads. */
  BadgeDefinitionLike,
} from './utils';

/** Badge grouping for profile and statistics screens. */
export {
  /** badgeType of level mastery badges ('level_mastery'). */
  LEVEL_MASTERY_BADGE_TYPE,
  /** badgeType of games-played badges ('games_played'). */
  GAMES_PLAYED_BADGE_TYPE,
  /** Split badge definitions into sorted level/game lists with isEarned. */
  groupBadgeProgress,
} from './utils';

// ============================================================================
// Hint Access Utilities
// ============================================================================

/** Types for the hint access panel. */
export type {
  /** What the hint access panel's button does. */
  HintAccessAction,
  /** Which message the hint access panel shows. */
  HintAccessVariant,
  /** Action and message variant for a hint access state. */
  HintAccessPresentation,
} from './utils';

/** Client-side hint gating helpers. */
export {
  /** Hint steps visible without the level's entitlement (2). */
  FREE_HINT_STEP_LIMIT,
  /** Map a hint access state to the panel's action and message variant. */
  getHintAccessAction,
  /** i18n key suffixes for the hint access messages. */
  HINT_ACCESS_KEY_SUFFIXES,
} from './utils';

// ============================================================================
// Daily Date Utilities
// ============================================================================

/** Calendar-date helpers for daily puzzles (UTC "today", like the API). */
export {
  /** UTC date of a Date (default now) as YYYY-MM-DD. */
  getUtcDateString,
  /** Normalize a daily date to YYYY-MM-DD without a timezone shift, or null. */
  normalizeDailyDate,
  /** Format a YYYY-MM-DD daily date as a local calendar date. */
  formatDailyDate,
  /** Whether a saved daily is not today's (UTC) daily. */
  isStaleDaily,
} from './utils';

// ============================================================================
// Game Fetch Status Utilities
// ============================================================================

/** Response shape (with the legacy action field) read by getGameFetchStatus. */
export type { GameFetchResponse } from './utils';

/** Status derivation shared by useLevelGame and useDailyGame. */
export {
  /** Whether a response/error says sign-in is required (legacy API signal). */
  isAuthRequiredResponse,
  /** Whether a response/error says a subscription is required (legacy API signal). */
  isSubscriptionRequiredResponse,
  /** Derive a GameFetchStatus from query state. */
  getGameFetchStatus,
  /** HTTP status carried by an error (NetworkError.status), or undefined. */
  getErrorHttpStatus,
  /** Derive a PracticeFetchStatus (401/402 aware) from query state. */
  getPracticeFetchStatus,
} from './utils';

/** Status of a practice fetch ('loading' | 'ready' | 'auth_required' | 'subscription_required' | 'no_practices' | 'error'). */
export type { PracticeFetchStatus } from './utils';

// ============================================================================
// Technique Example Utilities
// ============================================================================

/** Types for technique example walkthroughs. */
export type {
  /** Stored example/practice fields a walkthrough is built from. */
  TechniqueExampleSource,
  /** Translation functions (hints, techniques, default namespaces). */
  TechniqueWalkthroughTranslations,
  /** Walkthrough cards and their headings. */
  TechniqueWalkthrough,
} from './utils';

/** Build walkthrough cards and headings for a stored technique example. */
export { buildTechniqueWalkthrough } from './utils';

// ============================================================================
// Hooks
// ============================================================================

export {
  // Data hooks
  /** Fetch a single difficulty level by number. */
  useLevel,
  /** Fetch all difficulty levels with sorting and filtering utilities. */
  useLevels,
  /** Fetch a single solving technique by number. */
  useTechnique,
  /** Fetch all solving techniques with grouping utilities. */
  useTechniques,
  /** Fetch communities for a specific language with platform grouping. */
  useCommunities,
  /** Fetch learning materials with filtering by technique and language. */
  useLearning,
  /** Fetch a single learning item by UUID. */
  useLearningItem,

  /**
   * @deprecated Use `useSudoku` instead. `useGame` uses a legacy 2D array board
   * representation, while `useSudoku` uses a flat 81-cell array consistent with
   * the Kotlin renderable layer and the rest of the codebase.
   */
  useGame,

  /** Primary game state hook with flat 81-cell board, pencil mode, and scrambling. */
  useSudoku,

  /** Teaching/hint integration with the solver API (legacy GameHint format). */
  useGameTeaching,

  /** Fetch a random board for a specific level with auth/subscription handling. */
  useLevelGame,
  /** Fetch today's daily puzzle with auth/subscription handling. */
  useDailyGame,

  /** Game timer using refs to avoid re-renders every second. */
  useGameTimer,

  /** Persist individual game progress to localStorage. */
  useGamePersistence,
  /** Auto-save game state with debouncing. */
  useAutoSave,

  /** Generic typed localStorage hook with SSR safety. */
  useLocalStorage,

  /** Solver hint integration matching Kotlin HintInteractor behavior. */
  useHint,

  /** Current game management with Zustand store (daily/play slots). */
  useGamePlay,

  /** Shared "Continue Last Sudoku" logic for web and RN. */
  useContinueGame,

  /** Manual puzzle entry mode with solver validation. */
  useBoardEntry,

  /** Scan a board from an image: givens, player digits and pencilmarks. */
  useBoardScan,

  /** Server-side game session management for gamification (points, badges). */
  useGameSession,

  /** Check whether a level is enabled for the current user's entitlements. */
  useLevelEnabled,
  /** Check whether a technique is enabled for the current user's entitlements. */
  useTechniqueEnabled,

  /** Convert internal user level (0-indexed) to display values (1-indexed + belt). */
  useDisplayLevel,

  /** Compute cumulative puzzle distribution across entitlement tiers. */
  usePuzzleDistribution,

  /** Shared hint step tracker for game screens (ref + state). */
  useHintStepTracker,

  /** Auto-hint orchestration for shared links/deep links. */
  useAutoHint,

  /** Progress reporting for game state persistence. */
  useProgressReporter,

  /** Regenerate hint_data for all stored practices via solver. */
  useRegeneratePracticeHints,

  /** Emit a hint action event to the active SudokuGame. */
  emitHintAction,
  /** Report hint status back after processing an action. */
  reportHintStatus,
  /** Subscribe to hint status updates. */
  onHintStatus,
  /** Hook for SudokuGame to listen for external hint action events. */
  useHintActionListener,

  /** Fire a callback once each time a puzzle becomes completed (re-arms on false). */
  useCompletionTrigger,
  /** Fetch strategies (unwrapped) with findStrategyByStub. */
  useStrategies,
  /** Fetch a random practice for a technique with auth/subscription/empty status. */
  usePracticeGame,
  /** Whether the user is a real (non-anonymous) account. */
  useIsRealUser,
  /** Whether the signed-in user is a site admin (GET /users/:uid siteAdmin). */
  useIsSiteAdmin,
  /** Look up a technique by path or alias (list first, then GET by path). */
  useTechniqueByPath,
  /** Fetch a technique's worked example and build its walkthrough. */
  useTechniqueExample,
  /** Build (memoized) the walkthrough for a stored technique example. */
  useTechniqueWalkthrough,
  /** Player's puzzle progress in localStorage (markCompleted, isCompleted, stats). */
  usePuzzleProgress,
  /** Account deletion rule and delete-then-sign-out sequence. */
  useDeleteAccount,
  /** Saved game to resume for a play screen (snapshot; clears stale dailies). */
  useResumeGame,
  /** The saved game a play screen should resume, or null (pure). */
  getResumeGame,
  /** Daily/Level play screen orchestration (resume, save, session, completion). */
  usePuzzleSession,
  /** Entered-puzzle save/resume after validation (no server session). */
  useEnteredGameSession,
} from './hooks';

export type {
  // Data hook types
  /** Options for useLevel hook. */
  UseLevelOptions,
  /** Result type for useLevel hook. */
  UseLevelResult,
  /** Options for useLevels hook. */
  UseLevelsOptions,
  /** Result type for useLevels hook. */
  UseLevelsResult,
  /** Options for useTechnique hook. */
  UseTechniqueOptions,
  /** Result type for useTechnique hook. */
  UseTechniqueResult,
  /** Options for useTechniques hook. */
  UseTechniquesOptions,
  /** Result type for useTechniques hook. */
  UseTechniquesResult,
  /** Options for useCommunities hook. */
  UseCommunitiesOptions,
  /** Result type for useCommunities hook. */
  UseCommunitiesResult,
  /** Options for useLearningItem hook. */
  UseLearningItemOptions,
  /** Result type for useLearningItem hook. */
  UseLearningItemResult,
  /** Options for useLearning hook. */
  UseLearningOptions,
  /** Result type for useLearning hook. */
  UseLearningResult,

  // Game hook types (legacy)
  /** @deprecated Options for legacy useGame hook. Use UseSudokuOptions instead. */
  UseGameOptions,
  /** @deprecated Result type for legacy useGame hook. Use UseSudokuResult instead. */
  UseGameResult,

  // Sudoku hook types
  /** Options for useSudoku hook (initial app settings). */
  UseSudokuOptions,
  /** Result type for useSudoku hook (state, computed values, actions, utilities). */
  UseSudokuResult,

  // Teaching hook types
  /** Options for useGameTeaching hook (network client, URL, token). */
  UseGameTeachingOptions,
  /** Result type for useGameTeaching hook (teaching state, hint actions). */
  UseGameTeachingResult,

  // Game fetching hook types
  /** Options for useLevelGame hook (network, auth, level number). */
  UseLevelGameOptions,
  /** Result type for useLevelGame hook (board data, fetch status). */
  UseLevelGameResult,
  /** Options for useDailyGame hook (network, auth). */
  UseDailyGameOptions,
  /** Result type for useDailyGame hook (daily data, fetch status). */
  UseDailyGameResult,
  /** Status of a game fetch: 'loading' | 'success' | 'auth_required' | 'subscription_required' | 'entitlement_required' | 'error'. */
  GameFetchStatus,

  // Timer hook types
  /** Options for useGameTimer hook (autoStart, initialTime). */
  UseGameTimerOptions,
  /** Result type for useGameTimer hook (elapsedRef, controls). */
  UseGameTimerResult,

  // Persistence hook types
  /** Options for useGamePersistence hook (puzzleKey, autoSave). */
  UseGamePersistenceOptions,
  /** Result type for useGamePersistence hook (load, save, clear, hasSaved). */
  UseGamePersistenceResult,

  // Hint hook types
  /** Options for useHint hook (network, puzzle state, technique filter). */
  UseHintOptions,
  /** Result type for useHint hook (hint steps, navigation, apply). */
  UseHintResult,
  /** Board data returned when applying a hint (user input, pencilmarks). */
  HintBoardData,
  /** Data passed to onHintReceived callback (hint, board data, technique info). */
  HintReceivedData,
  /** Access denied error info when hint level exceeds subscription tier. */
  HintAccessError,

  // Game play hook types
  /** Options for useGamePlay hook (slot selection, auto-save delay). */
  UseGamePlayOptions,
  /** Result type for useGamePlay hook (current game, start, update, clear). */
  UseGamePlayResult,

  // Continue game hook types
  /** Options for useContinueGame hook. */
  UseContinueGameOptions,
  /** Result type for useContinueGame hook. */
  UseContinueGameResult,
  /** Navigation target returned by useContinueGame. */
  ContinueTarget,

  // Board entry hook types
  /** Options for useBoardEntry hook (network client, URL, token). */
  UseBoardEntryOptions,
  /** Result type for useBoardEntry hook (cells, validation, actions). */
  UseBoardEntryReturn,
  /** Validated puzzle data from solver (puzzle + solution strings). */
  ValidatedPuzzle,

  // Board scan hook types
  /** Options for useBoardScan hook (network client, URL). */
  UseBoardScanOptions,
  /** Result type for useBoardScan hook (scan, isScanning). */
  UseBoardScanReturn,

  // Game session hook types
  /** Options for useGameSession hook (network, auth, userId). */
  UseGameSessionOptions,
  /** Result of starting a game session (sessionStarted, sessionId). */
  GameSessionResult,
  /** Result of finishing a game session (leveledUp, badges, points). */
  GameFinishResult,

  // Display level hook types
  /** Result type for useDisplayLevel hook. */
  UseDisplayLevelResult,

  // Hint step tracker types
  /** Result type for useHintStepTracker hook. */
  UseHintStepTrackerResult,

  // Auto-hint types
  /** Options for useAutoHint hook. */
  UseAutoHintOptions,

  // Practice admin types
  UseRegeneratePracticeHintsOptions,
  UseRegeneratePracticeHintsResult,

  // Progress reporter types
  /** Options for useProgressReporter hook. */
  UseProgressReporterOptions,
  /** Callback type for progress updates. */
  ProgressUpdateCallback,

  // Hint action types
  /** Status reported after a hint action is processed. */
  HintActionStatus,

  // Board entry play state
  /** What a validated entered puzzle should apply (entry pencilmarks). */
  BoardEntryPlayState,

  // Strategies hook types
  /** Options for useStrategies hook. */
  UseStrategiesOptions,
  /** Result type for useStrategies hook. */
  UseStrategiesResult,

  // Practice game hook types
  /** Options for usePracticeGame hook. */
  UsePracticeGameOptions,
  /** Result type for usePracticeGame hook. */
  UsePracticeGameResult,

  // User status hook types
  /** Options for useIsSiteAdmin hook. */
  UseIsSiteAdminOptions,
  /** Result type for useIsSiteAdmin hook. */
  UseIsSiteAdminResult,

  // Technique lookup / example hook types
  /** Options for useTechniqueByPath hook. */
  UseTechniqueByPathOptions,
  /** Result type for useTechniqueByPath hook. */
  UseTechniqueByPathResult,
  /** Where a technique example comes from ('example' | 'practice'). */
  TechniqueExampleSourceKind,
  /** Options for useTechniqueExample hook. */
  UseTechniqueExampleOptions,
  /** Result type for useTechniqueExample hook. */
  UseTechniqueExampleResult,

  // Puzzle progress hook types
  /** Options for usePuzzleProgress hook. */
  UsePuzzleProgressOptions,
  /** Result type for usePuzzleProgress hook. */
  UsePuzzleProgressResult,

  // Account deletion hook types
  /** What deleteAccount did ('deleted' | 'blocked' | 'failed'). */
  DeleteAccountOutcome,
  /** Provider tokens for account deletion (Google/Apple revocation). */
  DeleteAccountProviderTokens,
  /** Options for useDeleteAccount hook. */
  UseDeleteAccountOptions,
  /** Result type for useDeleteAccount hook. */
  UseDeleteAccountResult,

  // Play session hook types
  /** Play screen kind ('daily' | 'level'). */
  PuzzleSessionSource,
  /** Saved game kind useResumeGame can resume ('daily' | 'level' | 'entered'). */
  ResumeGameSource,
  /** Options for useEnteredGameSession hook. */
  UseEnteredGameSessionOptions,
  /** Result type for useEnteredGameSession hook. */
  UseEnteredGameSessionResult,
  /** Options for useResumeGame hook. */
  UseResumeGameOptions,
  /** Result type for useResumeGame hook. */
  UseResumeGameResult,
  /** The puzzle a play screen shows (fetched or resumed). */
  ActivePuzzle,
  /** Props for the game component from usePuzzleSession. */
  PuzzleGameProps,
  /** Fetched Daily/Board shape usePuzzleSession accepts. */
  SessionPuzzleInput,
  /** Options for usePuzzleSession hook. */
  UsePuzzleSessionOptions,
  /** Result type for usePuzzleSession hook. */
  UsePuzzleSessionResult,
} from './hooks';

// ============================================================================
// Stores
// ============================================================================

/** Zustand store for current game state with daily/play slots and localStorage persistence. */
export { useGamePlayStore } from './stores/gamePlayStore';
/** State shape for the game play Zustand store. */
export type { GamePlayState } from './stores/gamePlayStore';

// ============================================================================
// Config
// ============================================================================

/** Authentication provider configuration types. */
export type {
  /** Available auth provider types: 'google' | 'apple' | 'email'. */
  AuthProviderType,
  /** Configuration for which auth providers are enabled. */
  AuthProvidersConfig,
} from './config';

/** Default auth providers configuration (Google + Email, anonymous fallback). */
export { DEFAULT_AUTH_PROVIDERS } from './config';

// ============================================================================
// Entitlement Context
// ============================================================================

/** Provider that supplies entitlements to useLevelEnabled / useTechniqueEnabled. */
export { EntitlementProvider } from './context';
/** React context for entitlements (for advanced use). */
export { EntitlementContext, useEntitlementContext } from './context';

// ============================================================================
// Sudojo API Context
// ============================================================================

/** Optional provider of networkClient/baseUrl/token for sudojo_lib hooks. */
export { SudojoApiProvider } from './context';
/** API context, its hooks, and the option-over-context resolver. */
export {
  /** React context holding the API connection (for advanced use). */
  SudojoApiContext,
  /** The provider's API connection (throws without a provider). */
  useSudojoApi,
  /** The provider's API connection, or null. */
  useOptionalSudojoApi,
  /** Merge explicit options over a context value (pure; throws if incomplete). */
  resolveSudojoApi,
  /** Resolve a hook's API connection from options, then the provider. */
  useResolvedSudojoApi,
} from './context';
/** Types for the Sudojo API context. */
export type {
  /** The API connection the provider supplies. */
  SudojoApiValue,
  /** Optional networkClient/baseUrl/token fields of hook options. */
  SudojoApiOptions,
  /** An API connection with every field resolved (token '' when none). */
  ResolvedSudojoApi,
} from './context';

// ============================================================================
// Routing (shared route registry for web + native)
// ============================================================================

/**
 * The framework-agnostic registry of routes both apps share (`sudojoRoutes`),
 * plus the `SudojoRoutes` map type and the `SudojoNavigator` contract that the
 * shared UI libraries (`sudojo_ui`, `sudojo_ui_rn`) are typed over. Each app
 * binds its own navigator (react-router on web, react-navigation on native) to
 * this registry; see `src/routing/routes.ts`.
 */
export * from './routing/routes';

// ============================================================================
// Entitlement Utilities (re-exported from sudojo_types)
// ============================================================================

/** Parse a comma-delimited entitlement string into an array. */
export { parseEntitlements } from '@sudobility/sudojo_types';

/** Check if a user has the required entitlement for a level. */
export { hasRequiredEntitlement } from '@sudobility/sudojo_types';

// ============================================================================
// Admin (batch jobs + stats; see src/admin/index.ts for the full list)
// ============================================================================

/**
 * Admin module: board generation, technique extraction, example creation and
 * admin stats as hooks (`useBoardGenerator`, `useTechniqueExtractor`,
 * `useExampleCreator`, `useSingleBoardExtractor`, `useBoardTechniquesUpdater`,
 * `useAdminStats`), the framework-agnostic jobs behind them
 * (`runBoardGeneration`, `runTechniqueExtraction`, `runExampleCreation`) and
 * their pure rules (`mergeBoardWithUserInput`, `adjustPracticeSolution`,
 * `extractBoardTechniques`, `levelsToSearchForTechnique`, …). Network calls go
 * only through sudojo_client hooks (`useAdminApi`).
 */
export * from './admin';
