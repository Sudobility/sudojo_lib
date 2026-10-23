/**
 * Hint access gating (client side).
 *
 * The API serves every hint step to everyone (sudojo_api removed its hint
 * tiers), so gating happens in useHint: without the level's entitlement only
 * the first FREE_HINT_STEP_LIMIT steps are visible and `accessError` is set.
 */

import type { HintAccessUserState } from '@sudobility/sudojo_types';

/** Number of hint steps shown for free before the paywall. */
export const FREE_HINT_STEP_LIMIT = 2;

/** What the hint-access panel's button does. */
export type HintAccessAction =
  /** Open sign-in over the game, then dismiss the panel */
  | 'sign_in'
  /** Go to the subscription screen */
  | 'subscribe'
  /** Nothing to offer: just close the panel */
  | 'dismiss';

/** Which message the hint-access panel shows. */
export type HintAccessVariant =
  'login' | 'subscription' | 'upgrade' | 'unavailable';

/** Panel behavior for one access state. */
export interface HintAccessPresentation {
  action: HintAccessAction;
  variant: HintAccessVariant;
}

/**
 * Map a hint access state to the panel's action and message variant, as the
 * web and RN HintAccessPanel do:
 *
 * - `anonymous` → sign in (`login` message)
 * - `no_subscription` → subscribe (`subscription` message)
 * - `insufficient_tier` → subscribe (`upgrade` message)
 * - anything else → dismiss (`unavailable` message)
 *
 * Note: useHint's client-side gate only produces `no_subscription` and
 * `insufficient_tier`. `anonymous` came from the API's 402, which it no
 * longer sends.
 */
export function getHintAccessAction(
  state: { userState?: HintAccessUserState | string | null } | null | undefined
): HintAccessPresentation {
  switch (state?.userState) {
    case 'anonymous':
      return { action: 'sign_in', variant: 'login' };
    case 'no_subscription':
      return { action: 'subscribe', variant: 'subscription' };
    case 'insufficient_tier':
      return { action: 'subscribe', variant: 'upgrade' };
    default:
      return { action: 'dismiss', variant: 'unavailable' };
  }
}

/**
 * i18n key suffixes for each message variant except `unavailable`, which the
 * apps word differently. Both apps use these suffixes under their own prefix
 * (web `game.hint.access.`, RN `game.hintAccess.`).
 */
export const HINT_ACCESS_KEY_SUFFIXES = {
  login: {
    title: 'loginRequired',
    message: 'loginMessage',
    button: 'loginButton',
  },
  subscription: {
    title: 'subscriptionRequired',
    message: 'subscriptionMessage',
    button: 'subscribeButton',
  },
  upgrade: {
    title: 'upgradeRequired',
    message: 'upgradeMessage',
    button: 'upgradeButton',
  },
} as const;
