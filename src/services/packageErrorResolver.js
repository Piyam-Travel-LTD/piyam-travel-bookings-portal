const ACCESS_ERROR_MESSAGES = {
  400: 'Check the package reference and lead passenger surname, then try again.',
  404: 'Package details do not match. Check the lead passenger surname and reference.',
  410: 'Your document access has expired. Contact your agent to renew access.',
  429: 'Too many attempts. Please wait before trying again.',
  500: 'The package service is temporarily unavailable. Please try again shortly.',
  502: 'The package service is temporarily unavailable. Please try again shortly.',
  503: 'The package service is temporarily unavailable. Please try again shortly.',
  504: 'The package service is temporarily unavailable. Please try again shortly.'
};

const TOKEN_ERROR_MESSAGES = {
  ...ACCESS_ERROR_MESSAGES,
  400: 'This package access link is invalid. Contact your agent for a new link.',
  404: 'Package documents are not currently available. Contact your agent.',
  429: 'Too many requests. Please wait before trying this link again.'
};

/**
 * Convert an API failure to calm customer copy.
 * Use context `token` for direct package links and `access` for surname login.
 */
export const packageErrorResolver = (status, message, context = 'access') => {
  const errorMap = context === 'token' ? TOKEN_ERROR_MESSAGES : ACCESS_ERROR_MESSAGES;
  const numericStatus = Number(status);

  if (numericStatus && errorMap[numericStatus]) return errorMap[numericStatus];
  if (typeof message === 'string' && message.trim()) return message;

  return context === 'token'
    ? 'Package documents are not currently available. Contact your agent.'
    : ACCESS_ERROR_MESSAGES[404];
};

export const getPackageErrorMessage = (error, context = 'access') =>
  packageErrorResolver(error?.status, error?.message, context);
