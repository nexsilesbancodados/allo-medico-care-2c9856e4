/**
 * Supabase error handling utilities.
 * Wraps common patterns to avoid silent failures in production.
 */
import { PostgrestError } from '@supabase/supabase-js';
import { logError } from './logger';

export interface SupabaseResult<T> {
  data: T | null;
  error: PostgrestError | null;
}

/**
 * Safely executes a Supabase query and logs errors automatically.
 * Use this instead of raw await calls to prevent silent failures.
 *
 * @example
 * const { data, error } = await safeQuery(
 *   supabase.from('profiles').select('*').eq('user_id', userId),
 *   'fetchProfile'
 * );
 */
export async function safeQuery<T>(
  query: PromiseLike<{ data: T | null; error: PostgrestError | null }>,
  context?: string
): Promise<SupabaseResult<T>> {
  try {
    const result = await query;
    if (result.error) {
      logError(`Supabase${context ? `:${context}` : ''} query error`, result.error);
    }
    return result;
  } catch (e) {
    logError(`Supabase${context ? `:${context}` : ''} unexpected error`, e);
    return {
      data: null,
      error: { message: String(e), details: '', hint: '', code: 'UNKNOWN' },
    };
  }
}

/**
 * Throws if error is present. Use in critical paths where failure must bubble up.
 */
export function assertNoError<T>(result: SupabaseResult<T>, message: string): T {
  if (result.error || result.data === null) {
    throw new Error(`${message}: ${result.error?.message ?? 'Dados não encontrados'}`);
  }
  return result.data;
}

/**
 * Returns a user-friendly message from a Supabase/unknown error.
 */
export function getErrorMessage(error: PostgrestError | null | unknown): string {
  if (!error) return 'Erro desconhecido';
  if (typeof error === 'object' && error !== null && 'message' in error) {
    return (error as { message: string }).message;
  }
  return String(error);
}
