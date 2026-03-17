export const getFirestoreErrorCode = (error: unknown): string | undefined => {
  if (!error || typeof error !== 'object') return undefined;
  const code = (error as { code?: unknown }).code;
  return typeof code === 'string' ? code : undefined;
};

export const isPermissionDeniedError = (error: unknown): boolean =>
  getFirestoreErrorCode(error) === 'permission-denied';

export const isMissingIndexError = (error: unknown): boolean =>
  getFirestoreErrorCode(error) === 'failed-precondition';
