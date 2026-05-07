export const PUBLIC_ROUTES = new Set([
  '/',
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
]);

export const isPublicRoute = (pathname: string) => {
  if (PUBLIC_ROUTES.has(pathname)) return true;
  return pathname.startsWith('/api');
};
