/**
 * The shared route registry both Sudojo apps are built on.
 *
 * These are the routes the web app (`sudojo_app`, react-router) and the React
 * Native app (`sudojo_app_rn`, react-navigation) have in common — names, path
 * patterns and param shapes — in one place so the two cannot drift. Each app
 * binds its own navigator to this registry and extends it with its own extra
 * routes via `@sudobility/routing`'s `extendRoutes`: the web app adds its
 * content pages (home, login, pricing, profile, legal extras…), while native
 * folds several of those into other tabs.
 *
 * Framework-agnostic on purpose — this file imports no navigation library, so
 * it stays in sudojo_lib (business logic) rather than either app. Paths carry
 * no `/:lang` prefix: localisation of the URL is an app concern (the web app
 * nests everything under `/:lang`; native strips an optional language segment
 * in its `getStateFromPath`). The paths mirror what both apps already use, so
 * binding an adapter is a no-op on existing deep links:
 *   web `/:lang/play/daily`  ·  native `play/daily` deep link.
 */
import { defineRoutes, type Navigator, route } from '@sudobility/routing';

export const sudojoRoutes = defineRoutes({
  /** Level selection list (RN "Levels" screen, web "play"). */
  play: route('/play'),
  /** The daily puzzle. */
  daily: route('/play/daily'),
  /** Manual puzzle entry / OCR scan. */
  enter: route('/play/enter'),
  /**
   * A shared puzzle loaded from a URL. The board state travels in query params
   * (`original`, `user`, `pencilmarks`, …), which each app's adapter appends;
   * the path itself is param-free.
   */
  puzzle: route<{
    original?: string;
    user?: string;
    autopencilmarks?: string;
    pencilmarks?: string;
    level?: string;
    /** Hint step index (0-based) to auto-advance to. */
    hint?: string;
  }>('/play/puzzle'),
  /** Active game at a difficulty level. */
  levelPlay: route<{ level: string }>('/play/:level'),
  /** Techniques list, optionally scrolled to a group (`goto`). */
  techniques: route<{ goto?: string }>('/techniques'),
  /** A single technique by its URL slug (e.g. `naked-single`). */
  techniqueDetail: route<{ techniquePath: string; hint?: string }>(
    '/techniques/:techniquePath'
  ),
  /** Interactive practice puzzle for a numeric technique id. */
  practice: route<{ techniqueId: string }>('/practice/:techniqueId'),
  /** Strategy articles list. */
  strategies: route('/strategies'),
  /** A single strategy article by its URL slug (e.g. `naked-subsets`). */
  strategyDetail: route<{ strategyStub: string }>('/strategies/:strategyStub'),
  /** The communities list. */
  communities: route('/communities'),
  /** App settings. */
  settings: route('/settings'),
  /** RevenueCat subscription management. */
  subscription: route('/subscription'),
  /** Privacy policy. */
  privacy: route('/privacy'),
  /** Terms of service. */
  terms: route('/terms'),
});

/** The shared route map, for an app extending or navigating it. */
export type SudojoRoutes = typeof sudojoRoutes.routes;

/** The navigation contract shared UI depends on, over the shared routes. */
export type SudojoNavigator = Navigator<SudojoRoutes>;
