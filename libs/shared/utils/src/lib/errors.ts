export const ErrorMessage = {
  InvalidCredentials: 'InvalidCredentials',
  UserAlreadyExists: 'UserAlreadyExists',
  UserNotFound: 'UserNotFound',
  EmailNotVerified: 'EmailNotVerified',
  InvalidResetToken: 'InvalidResetToken',
  InvalidVerificationToken: 'InvalidVerificationToken',
  TokenExpired: 'TokenExpired',
  Forbidden: 'Forbidden',
  Unauthorized: 'Unauthorized',
} as const;

export type ErrorMessageKey = keyof typeof ErrorMessage;
