# CLAUDE.md

> **Git policy — never auto-commit or auto-push.** Leave your work in the working tree.
> Run `git commit`, `git push`, `gh pr create`, or `scripts/push_all.sh` **only when the user
> explicitly asks in that turn**. Approval for an earlier change does not carry forward, and
> finishing a task is not permission to commit it. Do not use feature branches — stay on the
> current branch (`main`).

This file provides context for AI assistants working on this codebase.

## Project Overview

`@sudobility/sudojo_lib` (v0.0.220) is the platform-neutral **business-logic layer** for the Sudojo
apps: React hooks, a Zustand store, pure utilities and types that sit between the API client
(`sudojo_client`) and the UIs (`sudojo_app` web, `sudojo_app_rn` mobile, `sudojo_ui`, `sudojo_extension`).
No UI components, no styling. Much of it is a port of the Kotlin Android app
("renderable" / `HintInteractor`), and comments reference the Kotlin originals.

Single package (no workspaces), TypeScript ESM, built with `tsc`, published to **GitHub Packages**
(not public npm — `.npmrc` routes `@sudobility` to `npm.pkg.github.com`), license BUSL-1.1.

## Commands

**Use Bun** (`bun.lock`). Do not use npm/yarn/pnpm. All scripts below are defined in `package.json`.

| Command | What it does |
|---|---|
| `bun install` | Install deps (needs a GitHub `read:packages` token for private `@sudobility/*`) |
| `bun run build` | `tsc -p tsconfig.build.json` → `dist/`, then `scripts/fix-esm-imports.mjs` |
| `bun run typecheck` | `tsc --noEmit` (strict `tsconfig.json`, **excludes `*.test.ts`**) |
| `bun run lint` / `lint:fix` | ESLint flat config incl. `prettier/prettier` rule |
| `bun run format` / `format:check` | Prettier on `src/**/*.ts` (not `.tsx`) |
| `bun run test:run` / `test:unit` | Vitest once (happy-dom); ~41 test files |
| `bun run test:watch` | Vitest watch mode (**there is no `bun run test`**) |
| `bun run test:coverage` | Vitest + v8 coverage → `coverage/` (gitignored); report only, ~38% lines |
| `bun run check-all` | lint + typecheck + test:run |
| `bun run quick-check` | lint + typecheck |
| `bun run dev` = `build:watch` | `tsc --watch` (**uses `tsconfig.json`, not the build config**) |
| `bun run clean` | `rm -rf dist` |

Single test file / name filter: `bun run test:run src/utils/time.test.ts`, `bun run test:run -t "formatTime"`.

## Architecture

```
sudojo_types (types, TechniqueId, entitlement helpers)
      │
sudojo_client (NetworkClient API calls + TanStack Query hooks)
      │
sudojo_lib  ◄── this repo: hooks · gamePlayStore · presenter/scrambler · i18n/hint text
      │
      ├── sudojo_ui (presentational components; peer dep on lib)
      ├── sudojo_app (web, Vite)      ├── sudojo_app_rn (React Native, Metro)
      └── sudojo_extension
Hints/validation go lib → sudojo_client → sudojo_api → sudojo_solver (C++ engine)
```

**Layering rule (owner's):** the apps are UI only; all business logic lives here. The lib talks to the
API **only through `sudojo_client` hooks** (`useSudojo*`, `useSolver*`, incl. mutations like
`useSolverSolveMutation`); it never calls `createSudojoClient`, `new SudojoClient` or `fetch`. A missing
endpoint hook belongs in `sudojo_client` first.

**API connection:** hooks take `networkClient` / `baseUrl` / `token` as options, but these are optional when the
app is wrapped in `SudojoApiProvider` (`src/context/SudojoApiContext.tsx`). Explicit options win; `token` falls back
to the provider only when `undefined` (explicit `null`/`''` = no token); with neither, the hook throws an error
naming `SudojoApiProvider`. New hooks resolve via `useResolvedSudojoApi(options, 'hookName')`.

Hook layers (full options/results in `docs/API.md`):

| Layer | Hooks |
|---|---|
| Data (TanStack Query via `sudojo_client`) | `useLevels`/`useLevel`, `useTechniques`/`useTechnique`, `useTechniqueByPath` (alias-aware), `useStrategies`, `useLearning`/`useLearningItem`, `useCommunities`, `useTechniqueExample`/`useTechniqueWalkthrough`, `useRegeneratePracticeHints` (admin) |
| Game fetching (auth/subscription status) | `useLevelGame`, `useDailyGame`, `usePracticeGame` (401→auth, 402→subscription, no_practices) |
| Account / user | `useIsRealUser`, `useIsSiteAdmin`, `useDeleteAccount` (rule + delete → injected `signOut`; dialogs stay in apps) |
| Admin (`src/admin/**`, re-exported via `export * from './admin'`) | `useBoardGenerator`, `useTechniqueExtractor`, `useExampleCreator`, `useSingleBoardExtractor`, `useBoardTechniquesUpdater`, `useAdminStats`; framework-agnostic `run*` jobs in `jobs.ts`, network via `useAdminApi` |
| Game state | `useSudoku` ⭐ (flat 81 cells, reducer), `useBoardEntry` (manual entry + solver validate, `toggleGiven`, `applyScan` → `initialPlayState`), `useBoardScan` (photo → `ScannedBoard` via `utils/scannedBoard.ts`; player digits merge into givens as `puzzle`, which `applyScan` enters/validate checks; only pencilmarks restored after validation), `useGame` (legacy 2D, **deprecated**) |
| Features | `useHint` ⭐, `useGameTeaching` (legacy), `useCompletionTrigger` (once per false→true, re-arms), `useGameTimer`, `useGamePersistence`/`useAutoSave`, `useLocalStorage`, `useHintStepTracker`, `useAutoHint`, `useProgressReporter`, `useHintActionListener` |
| Orchestration / app | `usePuzzleSession` + `useResumeGame` (Daily/Level screens), `useEnteredGameSession` (entered puzzles; no server session), `usePuzzleProgress`, `useGamePlay` (+ `useGamePlayStore`), `useContinueGame`, `useGameSession`, `useLevelEnabled`/`useTechniqueEnabled` (+ `EntitlementProvider`), `useDisplayLevel`, `usePuzzleDistribution` |

## Repo Map

```
src/
├── index.ts          # THE public API: every export, with JSDoc (~1.37k lines). Barrels feed it; admin via `export * from './admin'`.
├── hooks/            # 37 hook files + index.ts barrel; tests for useSudoku, useGame, useHint, useBoardEntry,
│                     # useBoardScan, useCompletionTrigger, usePuzzleSession, dataHooks (client wrappers)
├── admin/            # Admin batch jobs + hooks (board generation, technique extraction, examples, stats)
├── stores/gamePlayStore.ts   # Zustand persist store, 2 slots (daily/play), key 'sudojo-current-game', v2
├── types/            # sudoku.ts (flat 81-cell), game.ts (legacy 2D), display.ts (colors, hint display),
│                     # currentGame, gamePersistence, progress, settings, subscription
├── utils/            # sudokuScrambler, sudokuPresenter (+ solver hint → display conversion), techniqueWalkthrough,
│                     # techniqueExample, hintExplanation (~1.1k lines), localizedHint, entityTranslate, i18nKeys,
│                     # shareUrl, progress (+ applyPuzzleCompletion), subscription (RevenueCat, paywall savings),
│                     # technique (paths/aliases), techniqueBitmask (exact bigint), scannedBoard (OCR), language,
│                     # community, gamification (badges), hintAccess, date (UTC daily), gameFetchStatus, theme,
│                     # time, digitDisplay, auth, board + validation (legacy 2D)
├── context/          # EntitlementContext/Provider, SudojoApiContext/SudojoApiProvider (.tsx)
├── config/           # authProviders.ts (DEFAULT_AUTH_PROVIDERS)
└── test/setup.ts     # Vitest setup: mocks localStorage, window listeners, matchMedia
docs/API.md           # Full export reference (hook options/results) — keep in sync with src/index.ts
plans/IMPROVEMENTS.md # Improvement backlog (historical; items marked DONE/SKIPPED)
.github/workflows/ci-cd.yml  # Calls johnqh/workflows unified-cicd.yml (publish-target: github)
dist/                 # Build output (gitignored); package `files` = dist/**/*
```

## Key Behaviors

- **`useSudoku`** — reducer actions `LOAD_BOARD, SELECT_CELL, DESELECT_CELL, INPUT, TOGGLE_PENCIL_MODE,
  SET_PENCIL_MODE, UNDO, ERASE, AUTO_PENCILMARKS, UPDATE_APP_SETTINGS, RESET, APPLY_HINT_DATA`; undo
  stack of previous `SudokuPlay` states. `loadBoard(puzzle, solution, {scramble=true, symmetrical=false, source='LEVEL', levelUuid, boardUuid})`.
- **Scrambling** — `scrambleSudokuBoard(scrambler, cells, symmetrical) → {cells, digitMapping, reverseDigitMapping}`;
  deterministic (seed = hash of cells), permutes rows/columns/digits.
- **`useHint`** — first `getHint()` calls the solver via `useSolverSolveMutation`; later calls advance steps until the
  puzzle state (`puzzle|userInput|pencilmarks`) changes. `techniqueFilter` → filtered request first, then an unfiltered
  fallback (`isTargetTechnique` tells which). Without the level's entitlement only `FREE_HINT_STEP_LIMIT = 2` steps are
  visible, `canApply` is false, and `accessError` is set; a server 402 (`HintAccessDeniedError`) also lands in
  `accessError`. `applyHint()` returns `{user, pencilmarks, autoPencilmarks}` and clears.
- **`usePuzzleSession`** — call `useResumeGame` first (disables the fetch while resuming; RN passes `isStoreHydrated`),
  then pass `resume` + the fetched daily/board. Stale (non-UTC-today) dailies are cleared. Fresh puzzles are pinned,
  saved once per uuid from the *scrambled* snapshot, and a server session is started once per uuid for a real user —
  with the *scrambled* board and solution, because sudojo_api credits a hint (points, `hintUsed`) only when the hint's
  `original` equals the session board, and `useHint` sends the scrambled puzzle. RN differences are options
  (`startSessionOnResume`, `showEmptyAchievement`).
- **`gamePlayStore`** — slots `dailyGame`/`playGame`; persist migrations v0 (single `currentGame`) → v1 (two slots) → v2 (adds `autoPencilmarks`).

## Conventions

- Every public symbol is exported from `src/index.ts` with a JSDoc comment; hooks also through `src/hooks/index.ts`, utils through `src/utils/index.ts`, types through `src/types/index.ts`. Unexported = private.
- Hooks: `use*`; types `Use*Options` / `Use*Result` (`useBoardEntry` uses `UseBoardEntryReturn`).
- API-calling hooks take `networkClient` + `baseUrl` (+ `token` where auth applies) as options; nothing is resolved from a DI container.
- Board strings: 81 chars row-major, `0`/`.` empty; pencilmarks = 81 comma-separated digit groups; `index = row*9 + col`.
- Pure/immutable utils; reducers for complex state; `useRef` for non-rendering state (`useGameTimer`).
- Strict TS in `tsconfig.json` (`exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`, `noImplicitOverride`, …).
- Prettier: single quotes, semicolons, trailing commas es5, width 80, 2 spaces, `arrowParens: avoid`. ESLint enforces `sort-imports` (members only), `prefer-template`, `object-shorthand`; unused vars allowed with `_` prefix.
- Mark superseded APIs `@deprecated` instead of removing them (consumers pin exact versions — see below).

## Gotchas

- **`loadBoard` scrambles by default.** Send `getScrambledPuzzle()` (what the user sees) to the solver, not `getOriginalPuzzle()`; input/pencilmark strings are in scrambled space.
- **Two digit-display types:** `SudokuDisplay` (`'NUMERIC'|'KANJI'|'COLORS'|'EMOJIS'`, useSudoku settings) vs `DigitDisplay` (`'numeric'|'kanji'|'emojis'`, used by `displayDigit`, hint text). `displayDigit` has no colors mode.
- **`0.0.x` caret ranges pin exactly:** `^0.0.220` accepts only `0.0.220`. Every `sudojo_client` release forces a lib bump, and consumers' `^0.0.220` accept only this version.
- **Module-level singletons:** `useGamePlayStore` and the hint-action event bus (`useHintAction.ts`) break silently if a consumer bundles two copies of the lib; keep it deduped.
- Providers consumers must mount: `QueryClientProvider` (all data/fetching/admin/hint hooks go through `sudojo_client`); `EntitlementProvider` (else `useLevelEnabled` sees `[]` and paid levels are disabled). `SudojoApiProvider` is optional (see API connection above).
- `dist/` is **bundler-only**: emitted ESM has extensionless/directory imports, so `node -e "import('./dist/index.js')"` fails (`ERR_UNSUPPORTED_DIR_IMPORT`). Vite/Metro are fine.
- `typecheck` skips test files (excluded in `tsconfig.json`); only ESLint parses them (`tsconfig.eslint.json`).
- `tsconfig.build.json` relaxes `exactOptionalPropertyTypes`/`noUncheckedIndexedAccess` and sets `removeComments: false`; keep the latter or JSDoc disappears from `.d.ts`.
- `src/test/setup.ts` replaces `localStorage` with `vi.fn()` stubs (nothing persists; `getItem` → `undefined`), so tests needing storage must stub their own. It is also compiled into `dist/test/` and shipped (unreachable via `exports`).
- `UIColorLight`/`UIColorDark` hex values are intentional (iOS system palette for `<canvas>` rendering); do not replace with design-system className tokens (see comment in `types/display.ts`).
- **Vitest `beforeEach(() => fn())` that returns a function registers it as a teardown.** Use a block body (`beforeEach(() => { fn(); })`). Mock `@sudobility/sudojo_client` with `vi.mock`; values the factory needs go in `vi.hoisted`.
- `@sudobility/di` is a peer/dev dependency that `src/` never imports; it is required by `sudojo_client`.

## Known Issues (not fixed)

- **No coverage threshold.** `test:coverage` (and the misleadingly named `test:coverage:threshold`) only report (~38% lines). The old 70% threshold was mis-nested and never enforced, so it was removed (owner decision, 2026-09-10).
- `useGamePersistence` ignores its `autoSave`/`debounceMs` options (only `puzzleKey` is read); use `useAutoSave`.
- `useDailyGame` ignores `enabled` (destructured as `_enabled`), and computes today's date once per mount.
- No direct tests for `useGamePlay`, `useGameSession` (covered only through `usePuzzleSession`), `hintExplanation`, `techniqueWalkthrough`.

## Cross-Repo Contracts

Consumer dep ranges below pin exactly (`^0.0.x`). Dev/peer versions are from this repo's `package.json`.

| Sibling | Relationship | Keep in sync |
|---|---|---|
| `@sudobility/sudojo_types` ^1.2.80 | peer + dev dep | `SolverHintStep`/`SolverBoard`/`SolverColor` shapes; `TechniqueId` (24 techniques explained in `hintExplanation`, rest default); `hasRequiredEntitlement`, `getBeltForLevel`, `getSubscriptionOfferId` |
| `@sudobility/sudojo_client` ^0.0.178 | peer + dev dep | `solverSolve` options (`original,user,autoPencilmarks,pencilmarks,techniques`), `HintAccessDeniedError`, `useSudojo*` hooks, `useSolverValidate` |
| `@sudobility/types` ^1.9.78, `@sudobility/di` ^1.5.85 | peer + dev deps | `NetworkClient`, `BaseResponse` |
| `sudojo_solver` (via api) | indirect | `SudokuColor` string values must cover the solver's color names; hint areas/cells/links/groups consumed by `calculateCellHints`/`presentBoard` |
| `sudojo_app` | dep `^0.0.220` | share URLs `/daily` and `/play/puzzle?level&original&user&autopencilmarks&pencilmarks&hint`; `getWebUrl` strips `api.` from the API host |
| `sudojo_app_rn` | dep `^0.0.220` | shims `localStorage`, then swaps `useGamePlayStore.persist` storage to AsyncStorage, so the store must stay a default Zustand `persist` store named `sudojo-current-game` |
| `sudojo_ui` | peer + dev `^0.0.220` | presenter/color exports, `displayDigit`, `formatTime`, `DigitDisplay` |
| `sudojo_extension` | dep `^0.0.220` | `useSudoku`, `useHint`, `useBoardEntry`, `getHintActionSummary` |
| app i18n files | runtime | keys `belts.N.name`, `belts.N.label`, `levels.N`, `techniques.<path>.title`, and hint `stringKey`s |

No sibling consumer imports `useGame`, `useGameTeaching`, or the legacy 2D board/validation utilities.

## Release Flow (document only; never run unprompted)

1. Family release is driven from `sudojo_app/scripts/push_all.sh` (order: types → ocr → api → client → **lib** → ui → app → app_rn → extension → bot; 60 s wait after lib). Per repo it updates `@sudobility` deps, runs typecheck/lint/test/build, bumps the patch version, commits and pushes.
2. Push to `main` runs `.github/workflows/ci-cd.yml` → `johnqh/workflows` `unified-cicd.yml` (`publish-target: github`): typecheck, lint, test, build, then publish to **GitHub Packages** if this `package.json` version is not yet published. `develop` and unmerged PRs never publish.
3. `prepublishOnly` = `clean && build`. There is no manual publish step in normal use.

## Common Tasks

- **Add a hook:** create `src/hooks/useX.ts` with `UseXOptions`/`UseXResult` (optional `networkClient`/`baseUrl`/`token` via `useResolvedSudojoApi`; API calls only through `sudojo_client` hooks), export from `src/hooks/index.ts`, then from `src/index.ts` with JSDoc; add a `renderHook` test; run `bun run check-all`; update `docs/API.md`.
- **Add a util:** add to `src/utils/<area>.ts`, export via `src/utils/index.ts` and `src/index.ts`, add `*.test.ts` beside it.
- **Change a public signature:** grep consumers first (`grep -rn "@sudobility/sudojo_lib" ../sudojo_{app,app_rn,ui,extension}/src`), prefer additive changes + `@deprecated`.
- **Test against a local consumer:** `bun link` here, `bun link @sudobility/sudojo_lib` in the consumer (push_all strips these symlinks).
