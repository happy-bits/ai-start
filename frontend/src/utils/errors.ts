/**
 * Extract error message from unknown error type
 * @param err - The error to extract message from
 * @returns A user-friendly error message
 */
export function getErrorMessage(err: unknown): string {
  return err instanceof Error ? err.message : 'An error occurred';
}

