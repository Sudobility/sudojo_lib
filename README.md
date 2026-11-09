# @sudobility/sudojo_lib

Business logic library for Sudojo with React hooks for game state, hints, and Sudoku operations.

## Installation

```bash
bun add @sudobility/sudojo_lib
```

Published to **GitHub Packages** (not the public npm registry). Installing requires an `.npmrc`
that routes the `@sudobility` scope to GitHub Packages and a GitHub token with `read:packages`:

```
@sudobility:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GH_PACKAGES_READ_TOKEN}
```

## Usage

```typescript
import { useSudoku, useHint, presentBoard } from '@sudobility/sudojo_lib';

function Game({ puzzle, solution, networkClient, baseUrl, token }) {
  const sudoku = useSudoku();
  useEffect(() => sudoku.loadBoard(puzzle, solution), [puzzle, solution]);

  const { hint, getHint, applyHint, isLoading } = useHint({
    networkClient,
    baseUrl,
    token,
    puzzle: sudoku.getScrambledPuzzle(), // boards are scrambled by default
    userInput: sudoku.getInputString(),
    pencilmarks: sudoku.getPencilmarksString(),
  });

  const cells = presentBoard({
    cells: sudoku.board?.cells ?? [],
    selectedIndex: sudoku.selectedIndex,
    showErrors: true,
  });
}
```

Server-data hooks (`useLevels`, `useDailyGame`, `useLevelGame`, `useBoardEntry`, `useGameSession`, ...)
need a TanStack `QueryClientProvider`; `useLevelEnabled` / `useTechniqueEnabled` read from `EntitlementProvider`.

## API

- **Game state**: `useSudoku` (flat 81-cell board; replaces deprecated `useGame`), `useBoardEntry`
- **Hints**: `useHint`, `useAutoHint`, hint text and technique walkthrough builders
- **Persistence**: `useGamePlay` / `useGamePlayStore` (Zustand, daily + play slots), `useGameTimer`
- **Server data**: `useLevels`, `useTechniques`, `useLearning`, `useCommunities`, `useDailyGame`, `useLevelGame`, `useGameSession`
- **Utilities**: `presentBoard`, scrambler and puzzle-string helpers, progress, time, theme, i18n keys, share URLs

Full reference: [docs/API.md](docs/API.md). Shared by `sudojo_app` (web), `sudojo_app_rn` (mobile),
`sudojo_ui`, and `sudojo_extension`.

## Development

Uses [Bun](https://bun.sh) (`bun.lock`); do not mix in npm/yarn/pnpm.

```bash
bun run build        # Build to dist/ (tsc + fix-esm-imports)
bun run test:run     # Run Vitest once (alias: test:unit)
bun run test:watch   # Run Vitest in watch mode
bun run test:coverage # Run Vitest with v8 coverage
bun run typecheck    # TypeScript check (tsc --noEmit)
bun run lint         # ESLint
bun run check-all    # Lint + typecheck + test:run
```

## Related Packages

- `@sudobility/sudojo_client` -- API client hooks (peer dependency)
- `@sudobility/sudojo_types` -- Type definitions (peer dependency)
- `@sudobility/types`, `@sudobility/di`, `@tanstack/react-query`, `react`, `zustand` -- other peer dependencies
- `sudojo_app` / `sudojo_app_rn` / `sudojo_ui` / `sudojo_extension` -- Consumers

## License

BUSL-1.1
