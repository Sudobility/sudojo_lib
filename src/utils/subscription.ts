/**
 * Subscription utilities
 *
 * These functions work with RevenueCat SDK types to convert to our domain models.
 * The RevenueCat types are passed as generics to avoid direct SDK dependency.
 */

import type { Level } from '@sudobility/sudojo_types';
import { getSubscriptionOfferId } from '@sudobility/sudojo_types';
import type { Product, Subscription } from '../types/subscription';
import type { TranslateFunction } from './localizedHint';

/** RevenueCat Package shape (simplified) */
interface RevenueCatPackage {
  identifier: string;
  rcBillingProduct?: {
    identifier?: string;
    title?: string;
    description?: string;
    currentPrice?: {
      amountMicros?: number;
      formattedPrice?: string;
    };
    normalPeriodDuration?: string;
    defaultSubscriptionOption?: {
      introPrice?: {
        price?: {
          formattedPrice?: string;
        };
        periodDuration?: string;
      };
      trial?: {
        periodDuration?: string;
      };
    };
  };
}

/** RevenueCat CustomerInfo entitlement shape */
interface RevenueCatEntitlement {
  expirationDate?: number | null;
  latestPurchaseDate?: number | null;
  productIdentifier?: string;
  willRenew?: boolean;
}

/** RevenueCat CustomerInfo shape (simplified) */
interface RevenueCatCustomerInfo {
  entitlements: {
    active: Record<string, RevenueCatEntitlement>;
  };
}

/**
 * Convert RevenueCat package to our Product interface
 *
 * @param pkg - RevenueCat package
 * @returns Product object
 */
export function convertPackageToProduct(pkg: RevenueCatPackage): Product {
  const product = pkg.rcBillingProduct;
  const subscriptionOption = product?.defaultSubscriptionOption;

  const result: Product = {
    identifier: pkg.identifier,
    price: product?.currentPrice?.amountMicros
      ? (product.currentPrice.amountMicros / 1000000).toFixed(2)
      : '0',
    priceString: product?.currentPrice?.formattedPrice ?? '$0',
    title: product?.title ?? pkg.identifier,
    description: product?.description ?? '',
  };

  if (product?.identifier !== undefined) {
    result.productId = product.identifier;
  }
  if (product?.normalPeriodDuration !== undefined) {
    result.period = product.normalPeriodDuration;
  }
  if (subscriptionOption?.introPrice?.price?.formattedPrice !== undefined) {
    result.introPrice = subscriptionOption.introPrice.price.formattedPrice;
  }
  if (subscriptionOption?.introPrice?.periodDuration !== undefined) {
    result.introPricePeriod = subscriptionOption.introPrice.periodDuration;
  }
  if (subscriptionOption?.trial?.periodDuration !== undefined) {
    result.freeTrialPeriod = subscriptionOption.trial.periodDuration;
  }

  return result;
}

/**
 * Parse RevenueCat CustomerInfo into our Subscription interface
 *
 * @param customerInfo - RevenueCat customer info
 * @returns Subscription object
 */
export function parseCustomerInfo(
  customerInfo: RevenueCatCustomerInfo
): Subscription {
  const hasActiveEntitlement =
    Object.keys(customerInfo.entitlements.active).length > 0;
  const activeEntitlement = Object.values(customerInfo.entitlements.active)[0];

  if (hasActiveEntitlement && activeEntitlement) {
    const subscription: Subscription = { isActive: true };

    if (activeEntitlement.expirationDate != null) {
      subscription.expirationDate = new Date(activeEntitlement.expirationDate);
    }
    if (activeEntitlement.latestPurchaseDate != null) {
      subscription.purchaseDate = new Date(
        activeEntitlement.latestPurchaseDate
      );
    }
    if (activeEntitlement.productIdentifier !== undefined) {
      subscription.productIdentifier = activeEntitlement.productIdentifier;
    }
    if (activeEntitlement.willRenew !== undefined) {
      subscription.willRenew = activeEntitlement.willRenew;
    }

    return subscription;
  }

  return { isActive: false };
}

/**
 * Get display name for subscription period
 *
 * @param period - ISO 8601 duration string (e.g., "P1M", "P1Y")
 * @returns Human-readable period name
 */
export function getPeriodDisplayName(period: string | undefined): string {
  if (!period) return '';

  const periodMap: Record<string, string> = {
    P1W: 'Weekly',
    P1M: 'Monthly',
    P3M: 'Quarterly',
    P6M: 'Semi-Annual',
    P1Y: 'Annual',
    P12M: 'Annual',
  };

  return periodMap[period] ?? period;
}

/**
 * Check if a plan is the "best value" (typically annual plans)
 *
 * @param period - ISO 8601 duration string
 * @returns Whether this is typically the best value option
 */
export function isBestValuePlan(period: string | undefined): boolean {
  return period === 'P1Y' || period === 'P12M';
}

/**
 * Get RevenueCat purchase error message
 *
 * @param errorCode - RevenueCat error code
 * @returns User-friendly error message
 */
export function getRevenueCatErrorMessage(errorCode: number): string {
  switch (errorCode) {
    case 1:
      return 'Purchase cancelled';
    case 2:
      return 'Store problem occurred. Please try again later.';
    case 3:
      return 'Purchase not allowed on this device';
    case 7:
      return 'Network error. Please check your connection.';
    default:
      return 'Purchase failed. Please try again.';
  }
}

// =============================================================================
// Paywall display helpers
// =============================================================================

/** Named periods (as @sudobility/subscription_lib reports them) → ISO 8601. */
const NAMED_PERIOD_TO_ISO: Readonly<Record<string, string>> = {
  weekly: 'P1W',
  monthly: 'P1M',
  quarterly: 'P3M',
  yearly: 'P1Y',
};

function toIsoPeriod(period: string | null | undefined): string | undefined {
  if (!period) return undefined;
  return NAMED_PERIOD_TO_ISO[period.toLowerCase()] ?? period.toUpperCase();
}

/**
 * i18n key (in the `subscription` namespace) for a period's unit, or null.
 * `P1W` → `periods.week`, `P1M` → `periods.month`, `P3M` → `periods.quarter`,
 * `P6M` → `periods.halfYear`, `P1Y` / `P12M` → `periods.year`. Named periods
 * (`monthly`, `yearly`, ...) are accepted too.
 *
 * The web paywall's copy had no week and no `P12M` (it showed no unit for
 * them); both are mapped here.
 */
export function getPeriodLabelKey(
  period: string | null | undefined
): string | null {
  switch (toIsoPeriod(period)) {
    case 'P1W':
    case 'P7D':
      return 'periods.week';
    case 'P1M':
      return 'periods.month';
    case 'P3M':
      return 'periods.quarter';
    case 'P6M':
      return 'periods.halfYear';
    case 'P1Y':
    case 'P12M':
      return 'periods.year';
    default:
      return null;
  }
}

/**
 * Price suffix for a period, e.g. `/month`, or '' for an unknown period.
 *
 * @param tSub - Translate function for the `subscription` namespace
 */
export function getPeriodLabel(
  tSub: TranslateFunction,
  period: string | null | undefined
): string {
  const key = getPeriodLabelKey(period);
  return key ? `/${tSub(key)}` : '';
}

/**
 * Whether a product is the "best value" plan: an annual period (`P1Y`, `P12M`,
 * `yearly`) or an identifier containing `annual` / `yearly`
 * (case-insensitive). Unifies the web paywall's check with isBestValuePlan.
 */
export function isBestValueProduct(product: {
  period?: string | null;
  identifier?: string | null;
}): boolean {
  const iso = toIsoPeriod(product.period);
  if (iso === 'P1Y' || iso === 'P12M') return true;
  const id = product.identifier?.toLowerCase() ?? '';
  return id.includes('annual') || id.includes('yearly');
}

/**
 * Length of a subscription period in months, or null when unknown.
 *
 * Accepts the named periods @sudobility/subscription_lib uses (`weekly` 1/4,
 * `monthly` 1, `quarterly` 3, `yearly` 12, `lifetime` Infinity, matching its
 * `periodToMonths`) and ISO 8601 durations (`P1W`, `P6M`, `P1Y`, `P30D`, ...).
 */
export function subscriptionPeriodToMonths(
  period: string | null | undefined
): number | null {
  if (!period) return null;
  const lower = period.toLowerCase();
  switch (lower) {
    case 'weekly':
      return 1 / 4;
    case 'monthly':
      return 1;
    case 'quarterly':
      return 3;
    case 'yearly':
      return 12;
    case 'lifetime':
      return Infinity;
  }
  const match = /^P(\d+)([DWMY])$/.exec(period.toUpperCase());
  if (!match?.[1] || !match[2]) return null;
  const value = parseInt(match[1], 10);
  switch (match[2]) {
    case 'D':
      return value / 30;
    case 'W':
      return value / 4;
    case 'M':
      return value;
    default:
      return value * 12;
  }
}

/** Price and period of a plan, for savings calculations. */
export interface PricedPeriod {
  /** Price in the store currency (major units) */
  price: number;
  /** Period, named (`monthly`) or ISO 8601 (`P1M`) */
  period?: string | null;
}

/**
 * Percent saved per month by `plan` compared with `base` (e.g. annual vs
 * monthly), rounded; null when not comparable (same or unknown/lifetime
 * period, missing product, zero base price) or when there is no saving.
 * Port of the RN SubscriptionScreen's calcSavingsPercent.
 */
export function calculateSavingsPercent(
  base: PricedPeriod | null | undefined,
  plan: PricedPeriod | null | undefined
): number | null {
  if (!base || !plan) return null;
  const baseMonths = subscriptionPeriodToMonths(base.period);
  const planMonths = subscriptionPeriodToMonths(plan.period);
  if (baseMonths == null || planMonths == null) return null;
  if (baseMonths <= 0 || planMonths <= 0) return null;
  if (!isFinite(baseMonths) || !isFinite(planMonths)) return null;
  if (baseMonths === planMonths) return null;
  const baseMonthlyCost = base.price / baseMonths;
  const planMonthlyCost = plan.price / planMonths;
  if (baseMonthlyCost <= 0) return null;
  const savings = Math.round(
    ((baseMonthlyCost - planMonthlyCost) / baseMonthlyCost) * 100
  );
  return savings > 0 ? savings : null;
}

/**
 * Whether the active subscription was bought on another platform than this
 * client's (so it must be managed there). False when either side is unknown.
 * Matches the RN SubscriptionScreen's isCrossPlatform.
 */
export function isCrossPlatformSubscription(
  purchasePlatform: string | null | undefined,
  clientPlatform: string | null | undefined
): boolean {
  return (
    !!purchasePlatform &&
    !!clientPlatform &&
    purchasePlatform !== clientPlatform
  );
}

/** Why an account cannot be deleted right now. */
export type DeleteAccountBlocker =
  /** No signed-in user */
  | 'not_signed_in'
  /** Anonymous (guest) user: there is no account to delete */
  | 'anonymous'
  /** An active subscription must be cancelled first */
  | 'active_subscription';

/** Result of canDeleteAccount. */
export type DeleteAccountCheck =
  { allowed: true } | { allowed: false; reason: DeleteAccountBlocker };

/**
 * Whether the user may delete their account now. The rule both apps apply:
 * signed in with a real (non-anonymous) account, and no active subscription
 * ("Please cancel your subscription before deleting your account." —
 * `deleteAccountUnsubscribeFirst`). The API also refuses deletion with an
 * active subscription when RevenueCat is configured.
 */
export function canDeleteAccount(state: {
  user:
    { uid?: string | null; isAnonymous?: boolean | null } | null | undefined;
  subscriptionActive: boolean | null | undefined;
}): DeleteAccountCheck {
  if (!state.user?.uid) return { allowed: false, reason: 'not_signed_in' };
  if (state.user.isAnonymous) return { allowed: false, reason: 'anonymous' };
  if (state.subscriptionActive) {
    return { allowed: false, reason: 'active_subscription' };
  }
  return { allowed: true };
}

/**
 * Fraction (0-1) of puzzles a subscription offer unlocks, summed from the
 * levels' `percentage`:
 *
 * - No offerId — only free levels (no subscription required)
 * - `'1_blue_belt'` — free levels + blue_belt levels
 * - Anything else — 1.0 (all puzzles)
 *
 * usePuzzleDistribution is the memoized hook form.
 */
export function getPuzzleDistribution(
  levels: ReadonlyArray<Pick<Level, 'entitlement' | 'percentage'>>,
  offerId?: string | null
): number {
  if (offerId && offerId !== '1_blue_belt') return 1.0;

  let total = 0;
  for (const level of levels) {
    const levelOfferId = getSubscriptionOfferId(level.entitlement);
    if (
      !levelOfferId ||
      (offerId === '1_blue_belt' && levelOfferId === '1_blue_belt')
    ) {
      total += level.percentage ?? 0;
    }
  }
  return total;
}

/** A plan as the paywall lists it (price may be a string, as on Product). */
export interface PaywallPlan {
  /** Price in the store currency (major units), e.g. 4.99 or '4.99' */
  price: number | string;
  /** Period, named (`monthly`) or ISO 8601 (`P1M`) */
  period?: string | null;
}

/**
 * The plan the savings badge compares with: the one with the shortest known
 * period (usually monthly). Plans with an unknown period are skipped; the
 * first of equal periods wins. Null when no plan has a known period.
 * (Web SubscriptionPaywall's baseProduct.)
 */
export function selectSavingsBasePlan<T extends { period?: string | null }>(
  products: readonly T[]
): T | null {
  let base: T | null = null;
  let baseMonths = Infinity;
  for (const product of products) {
    const months = subscriptionPeriodToMonths(product.period);
    if (months != null && months < baseMonths) {
      base = product;
      baseMonths = months;
    }
  }
  return base;
}

/**
 * Percent `plan` saves per month against the savings base plan of
 * `products` (selectSavingsBasePlan), via calculateSavingsPercent; null when
 * not comparable or no saving. The web paywall shows it only on the
 * best-value plan (isBestValueProduct).
 */
export function getPlanSavingsPercent(
  products: readonly PaywallPlan[],
  plan: PaywallPlan
): number | null {
  const base = selectSavingsBasePlan(products);
  if (!base) return null;
  const toPriced = (p: PaywallPlan): PricedPeriod => ({
    price: typeof p.price === 'number' ? p.price : parseFloat(p.price),
    period: p.period ?? null,
  });
  return calculateSavingsPercent(toPriced(base), toPriced(plan));
}
