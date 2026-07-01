type SeedValue = {
  label: string;
  value: string;
  order: number;
  /** i18n translations of `label`, keyed by locale → stored in metadata.i18n */
  metadata?: { i18n: Record<string, string> };
};

type LookupSeed = {
  key: string;
  name: string;
  description: string;
  values: SeedValue[];
};

/**
 * Build lookup values. `translations` maps locale → { valueSlug → localizedLabel }
 * and is attached as `metadata.i18n` per value so the lookup label can be shown
 * in the user's language (see docs/FORMS.md — reference-data localization).
 */
function toValues(
  items: Array<string | { label: string; value: string }>,
  translations: Record<string, Record<string, string>> = {},
): SeedValue[] {
  return items.map((item, i) => {
    const label = typeof item === 'string' ? item : item.label;
    const value =
      typeof item === 'string'
        ? item.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
        : item.value.toLowerCase();

    const i18n: Record<string, string> = {};
    for (const [locale, map] of Object.entries(translations)) {
      if (map[value]) i18n[locale] = map[value];
    }

    const out: SeedValue = { label, value, order: i };
    if (Object.keys(i18n).length) out.metadata = { i18n };
    return out;
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

  // ─── SupplierTrade / agriculture reference data ───────────────
  // Keys are referenced by `x-lookup` in config/domains/agriculture/schemas
  // and by LOOKUP_KEYS in @org/dto. See docs/FORMS.md.
  {
    key: 'agri-commodities',
    name: 'Agri Commodities',
    description: 'Commodity categories a supplier deals in / a lot contains',
    values: toValues(
      [
        { label: 'Grains', value: 'grains' },
        { label: 'Pulses', value: 'pulses' },
        { label: 'Oilseeds', value: 'oilseeds' },
        { label: 'Spices', value: 'spices' },
        { label: 'Fruits', value: 'fruits' },
        { label: 'Vegetables', value: 'vegetables' },
      ],
      {
        hi: {
          grains: 'अनाज',
          pulses: 'दालें',
          oilseeds: 'तिलहन',
          spices: 'मसाले',
          fruits: 'फल',
          vegetables: 'सब्ज़ियाँ',
        },
        es: {
          grains: 'Granos',
          pulses: 'Legumbres',
          oilseeds: 'Oleaginosas',
          spices: 'Especias',
          fruits: 'Frutas',
          vegetables: 'Verduras',
        },
      },
    ),
  },
  {
    key: 'indian-states',
    name: 'Indian States & UTs',
    description: 'States and union territories of India',
    values: toValues(
      [
        'Andhra Pradesh',
        'Arunachal Pradesh',
        'Assam',
        'Bihar',
        'Chhattisgarh',
        'Goa',
        'Gujarat',
        'Haryana',
        'Himachal Pradesh',
        'Jharkhand',
        'Karnataka',
        'Kerala',
        'Madhya Pradesh',
        'Maharashtra',
        'Manipur',
        'Meghalaya',
        'Mizoram',
        'Nagaland',
        'Odisha',
        'Punjab',
        'Rajasthan',
        'Sikkim',
        'Tamil Nadu',
        'Telangana',
        'Tripura',
        'Uttar Pradesh',
        'Uttarakhand',
        'West Bengal',
        'Andaman and Nicobar Islands',
        'Chandigarh',
        'Dadra and Nagar Haveli and Daman and Diu',
        'Delhi',
        'Jammu and Kashmir',
        'Ladakh',
        'Lakshadweep',
        'Puducherry',
      ],
      {
        // Hindi (agri default locale). Same mechanism extends to any locale.
        hi: {
          'andhra-pradesh': 'आंध्र प्रदेश',
          'arunachal-pradesh': 'अरुणाचल प्रदेश',
          assam: 'असम',
          bihar: 'बिहार',
          chhattisgarh: 'छत्तीसगढ़',
          goa: 'गोवा',
          gujarat: 'गुजरात',
          haryana: 'हरियाणा',
          'himachal-pradesh': 'हिमाचल प्रदेश',
          jharkhand: 'झारखंड',
          karnataka: 'कर्नाटक',
          kerala: 'केरल',
          'madhya-pradesh': 'मध्य प्रदेश',
          maharashtra: 'महाराष्ट्र',
          manipur: 'मणिपुर',
          meghalaya: 'मेघालय',
          mizoram: 'मिज़ोरम',
          nagaland: 'नागालैंड',
          odisha: 'ओडिशा',
          punjab: 'पंजाब',
          rajasthan: 'राजस्थान',
          sikkim: 'सिक्किम',
          'tamil-nadu': 'तमिलनाडु',
          telangana: 'तेलंगाना',
          tripura: 'त्रिपुरा',
          'uttar-pradesh': 'उत्तर प्रदेश',
          uttarakhand: 'उत्तराखंड',
          'west-bengal': 'पश्चिम बंगाल',
          'andaman-and-nicobar-islands': 'अंडमान और निकोबार द्वीप समूह',
          chandigarh: 'चंडीगढ़',
          'dadra-and-nagar-haveli-and-daman-and-diu':
            'दादरा और नगर हवेली और दमन और दीव',
          delhi: 'दिल्ली',
          'jammu-and-kashmir': 'जम्मू और कश्मीर',
          ladakh: 'लद्दाख',
          lakshadweep: 'लक्षद्वीप',
          puducherry: 'पुडुचेरी',
        },
      },
    ),
  },
];
