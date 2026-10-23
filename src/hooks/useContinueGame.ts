/**
 * useContinueGame - Shared hook for "Continue Last Sudoku" feature.
 *
 * Provides the current game state, a human-readable description,
 * and a navigation target that each app maps to its own routing API.
 *
 * Used by both sudojo_app (web) and sudojo_app_rn (React Native).
 */

import { useMemo } from 'react';
import type { Level } from '@sudobility/sudojo_types';
import { useGamePlay } from './useGamePlay';
import type { CurrentGame, GameSlot } from '../types/currentGame';
import { localizedField, type TranslateFunction } from '../utils/localizedHint';

export type ContinueTarget =
  { type: 'level'; levelId: string } | { type: 'entered' } | null;

export interface UseContinueGameOptions {
  /** Which game slot to check (default: 'play') */
  slot?: GameSlot;
  /** Loaded levels for resolving level titles */
  levels: Level[];
  /** i18n translate function (default 'app' namespace) */
  t: TranslateFunction;
  /** i18n translate function for 'levels' namespace */
  tLevels: TranslateFunction;
}

export interface UseContinueGameResult {
  /** The current game (null if none) */
  currentGame: CurrentGame | null;
  /** Whether there's a game to continue */
  hasCurrentGame: boolean;
  /** Human-readable description of the game to continue */
  description: string;
  /** Navigation target for the app to route to */
  target: ContinueTarget;
}

export function useContinueGame(
  options: UseContinueGameOptions
): UseContinueGameResult {
  const { slot = 'play', levels, t, tLevels } = options;
  const { currentGame, hasCurrentGame } = useGamePlay({ slot });

  const description = useMemo(() => {
    if (!currentGame) return '';
    switch (currentGame.source) {
      case 'level': {
        const level = levels.find(
          l => String(l.level) === String(currentGame.meta.levelId)
        );
        const title = level
          ? localizedField(t, level.localization?.title, '') ||
            tLevels(`${level.level}.title`) ||
            level.title
          : currentGame.meta.levelTitle;
        return title
          ? t('play.continueLevel', { level: title })
          : t('play.continuePuzzle');
      }
      case 'entered':
        return t('play.continueEntered');
      default:
        return '';
    }
  }, [currentGame, levels, t, tLevels]);

  const target = useMemo((): ContinueTarget => {
    if (!currentGame) return null;
    switch (currentGame.source) {
      case 'level':
        return { type: 'level', levelId: currentGame.meta.levelId ?? '' };
      case 'entered':
        return { type: 'entered' };
      default:
        return null;
    }
  }, [currentGame]);

  return {
    currentGame,
    hasCurrentGame,
    description,
    target,
  };
}
