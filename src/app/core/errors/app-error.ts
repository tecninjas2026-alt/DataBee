/**
 * Erro do app com código estável e mensagem segura para mostrar ao usuário (pt-BR).
 * Nunca coloque stack, token, e-mail de terceiros ou resposta crua do servidor em `message`.
 */
export type AppErrorCode =
  | 'config_missing'
  | 'auth_invalid_credentials'
  | 'auth_email_not_confirmed'
  | 'auth_weak_password'
  | 'auth_user_exists'
  | 'auth_rate_limited'
  | 'profile_unavailable'
  | 'network'
  | 'photo_cancelled'
  | 'photo_permission_denied'
  | 'photo_invalid'
  | 'photo_too_large'
  | 'location_permission_denied'
  | 'location_disabled'
  | 'location_timeout'
  | 'location_unavailable'
  | 'not_implemented'
  | 'unknown';

export class AppError extends Error {
  constructor(
    readonly code: AppErrorCode,
    message: string,
    override readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function isAppError(value: unknown): value is AppError {
  return value instanceof AppError;
}

/** Converte qualquer erro em mensagem exibível. Use em `catch` de páginas. */
export function toUserMessage(error: unknown): string {
  if (isAppError(error)) return error.message;
  if (error instanceof TypeError && /fetch|network/i.test(error.message)) {
    return 'Sem conexão com o servidor. Verifique a internet e tente novamente.';
  }
  return 'Algo deu errado. Tente novamente.';
}
