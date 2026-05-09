module.exports = {
  locales: ['en', 'es', 'fr', 'de', 'hi'],
  output: 'apps/app/public/locales/$LOCALE/$NAMESPACE.json',
  input: ['apps/app/src/**/*.{ts,tsx}', 'libs/shared/ui/src/**/*.{ts,tsx}'],
  defaultNamespace: 'translation',
  keySeparator: '.',
  namespaceSeparator: ':',
  // Keep existing translations, only add new keys
  keepRemoved: false,
  sort: true,
};
