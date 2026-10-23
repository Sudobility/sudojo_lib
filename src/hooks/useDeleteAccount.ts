/**
 * Hook for deleting the signed-in user's account: the rule (who may delete)
 * and the delete-then-sign-out sequence. Confirmation dialogs and error
 * alerts stay in the apps.
 */

import { useCallback, useMemo, useState } from 'react';
import type { NetworkClient } from '@sudobility/types';
import { useSudojoDeleteUser } from '@sudobility/sudojo_client';
import type { DeleteUserVariables } from '@sudobility/sudojo_client';
import { useResolvedSudojoApi } from '../context/SudojoApiContext';
import {
  canDeleteAccount,
  type DeleteAccountBlocker,
  type DeleteAccountCheck,
} from '../utils/subscription';

/** Provider tokens the API uses to revoke Sign in with Apple, etc. */
export type DeleteAccountProviderTokens = DeleteUserVariables['providerTokens'];

/** What deleteAccount did. */
export type DeleteAccountOutcome =
  | { status: 'deleted' }
  | { status: 'blocked'; reason: DeleteAccountBlocker }
  | { status: 'failed'; error: Error };

export interface UseDeleteAccountOptions {
  /** Network client for API calls (default: SudojoApiProvider) */
  networkClient?: NetworkClient | undefined;
  /** Base URL for the Sudojo API (default: SudojoApiProvider) */
  baseUrl?: string | undefined;
  /** Access token (default: SudojoApiProvider) */
  token?: string | null | undefined;
  /** The signed-in user */
  user:
    { uid?: string | null; isAnonymous?: boolean | null } | null | undefined;
  /** Whether the user has an active subscription (must cancel first) */
  subscriptionActive: boolean | null | undefined;
  /**
   * Sign out locally after the account is deleted (the API deletes the
   * Firebase user; the client must still drop its session).
   */
  signOut?: () => void | Promise<void>;
}

export interface UseDeleteAccountResult {
  /** Whether the account may be deleted now, and why not */
  canDelete: DeleteAccountCheck;
  /**
   * Delete the account (after the app's confirmation), then sign out.
   * Never throws: the outcome says whether it was blocked or failed.
   */
  deleteAccount: (
    providerTokens?: DeleteAccountProviderTokens
  ) => Promise<DeleteAccountOutcome>;
  /** True while the delete request (and sign-out) is in flight */
  isDeleting: boolean;
  /** The last failure, cleared on the next attempt */
  error: Error | null;
}

/**
 * @example
 * ```tsx
 * const { canDelete, deleteAccount, isDeleting } = useDeleteAccount({
 *   user, subscriptionActive: subscription.isActive, signOut,
 * });
 * const onPress = async () => {
 *   if (!canDelete.allowed) {
 *     if (canDelete.reason === 'active_subscription') alert(t('auth.deleteAccountUnsubscribeFirst'));
 *     return;
 *   }
 *   if (!confirm(t('auth.deleteAccountConfirm'))) return;
 *   const outcome = await deleteAccount();
 *   if (outcome.status === 'failed') alert(outcome.error.message);
 * };
 * ```
 */
export function useDeleteAccount(
  options: UseDeleteAccountOptions
): UseDeleteAccountResult {
  const { user, subscriptionActive, signOut } = options;
  const { networkClient, baseUrl, token } = useResolvedSudojoApi(
    options,
    'useDeleteAccount'
  );
  const { mutateAsync } = useSudojoDeleteUser(networkClient, baseUrl);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const canDelete = useMemo(
    () => canDeleteAccount({ user, subscriptionActive }),
    [user, subscriptionActive]
  );

  const deleteAccount = useCallback(
    async (
      providerTokens?: DeleteAccountProviderTokens
    ): Promise<DeleteAccountOutcome> => {
      if (!canDelete.allowed) {
        return { status: 'blocked', reason: canDelete.reason };
      }
      const userId = user?.uid ?? '';
      setIsDeleting(true);
      setError(null);
      try {
        await mutateAsync({
          token,
          userId,
          ...(providerTokens !== undefined && { providerTokens }),
        });
      } catch (err) {
        const failure =
          err instanceof Error
            ? err
            : new Error(String(err) || 'Failed to delete account');
        setError(failure);
        setIsDeleting(false);
        return { status: 'failed', error: failure };
      }
      try {
        // The account is gone either way; a failed local sign-out does not
        // make the deletion a failure.
        await signOut?.();
      } catch (err) {
        console.error('[useDeleteAccount] signOut failed:', err);
      } finally {
        setIsDeleting(false);
      }
      return { status: 'deleted' };
    },
    [canDelete, user, mutateAsync, token, signOut]
  );

  return { canDelete, deleteAccount, isDeleting, error };
}
