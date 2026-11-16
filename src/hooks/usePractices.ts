/**
 * Hook for admin practice operations
 */

import type { BaseResponse, NetworkClient } from '@sudobility/types';
import type { PracticesRegenerateHintsData } from '@sudobility/sudojo_types';
import type { UseMutationResult } from '@tanstack/react-query';
import { useSudojoRegeneratePracticeHints } from '@sudobility/sudojo_client';

export interface UseRegeneratePracticeHintsOptions {
  networkClient: NetworkClient;
  baseUrl: string;
}

export type UseRegeneratePracticeHintsResult = UseMutationResult<
  BaseResponse<PracticesRegenerateHintsData>,
  Error,
  { token: string }
>;

/**
 * Regenerate hint_data for all stored practices by calling the solver.
 * Returns a mutation that can be triggered with `mutate({ token })`.
 */
export function useRegeneratePracticeHints(
  options: UseRegeneratePracticeHintsOptions
): UseRegeneratePracticeHintsResult {
  return useSudojoRegeneratePracticeHints(
    options.networkClient,
    options.baseUrl
  );
}
