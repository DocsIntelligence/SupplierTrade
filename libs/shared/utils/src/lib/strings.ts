export const isEmail = (value: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

export const slugify = (input: string) =>
  input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-_\s]/g, '')
    .replace(/\s+/g, '-');

export const truncate = (value: string, max = 80) =>
  value.length <= max ? value : `${value.slice(0, max - 1)}…`;
