type LookupSeed = {
  key: string;
  name: string;
  description: string;
  values: Array<{ label: string; value: string; order: number }>;
};

function toValues(
  items: Array<string | { label: string; value: string }>,
): LookupSeed['values'] {
  return items.map((item, i) => {
    if (typeof item === 'string') {
      const value = item
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      return { label: item, value, order: i };
    }
    return { label: item.label, value: item.value.toLowerCase(), order: i };
  });
}

export const lookupGroups: LookupSeed[] = [
  {
    key: 'currency',
    name: 'Currency',
    description: 'Supported currencies',
    values: toValues([
      { label: 'USD ($)', value: 'USD' },
      { label: 'EUR (€)', value: 'EUR' },
      { label: 'INR (₹)', value: 'INR' },
      { label: 'GBP (£)', value: 'GBP' },
      { label: 'CAD (C$)', value: 'CAD' },
      { label: 'AUD (A$)', value: 'AUD' },
    ]),
  },
  {
    key: 'country',
    name: 'Country',
    description: 'Countries',
    values: toValues([
      'India',
      'United States',
      'United Kingdom',
      'Canada',
      'Australia',
      'Germany',
      'France',
      'Singapore',
      'United Arab Emirates',
      'Netherlands',
      'Other',
    ]),
  },
  {
    key: 'plan-interval',
    name: 'Plan Interval',
    description: 'Billing intervals for subscription plans',
    values: toValues([
      { label: 'Daily', value: 'daily' },
      { label: 'Weekly', value: 'weekly' },
      { label: 'Monthly', value: 'monthly' },
      { label: 'Quarterly', value: 'quarterly' },
      { label: 'Yearly', value: 'yearly' },
    ]),
  },
];
