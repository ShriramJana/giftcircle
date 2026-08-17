import { describe, expect, it } from 'vitest';
import { extractHouseNumber, formatPhotonFeature, toSuggestions } from '@/lib/geocode';

describe('formatPhotonFeature', () => {
  it('joins name, city, state, and country', () => {
    expect(
      formatPhotonFeature({
        properties: { name: 'Hollis Farm', city: 'Petaluma', state: 'California', country: 'United States' },
      }),
    ).toBe('Hollis Farm, Petaluma, California, United States');
  });

  it('falls back to street and house number when there is no name', () => {
    expect(
      formatPhotonFeature({
        properties: { housenumber: '42', street: 'Main St', city: 'Oakland', country: 'United States' },
      }),
    ).toBe('42 Main St, Oakland, United States');
  });

  it('drops duplicate parts, like a city that equals the name', () => {
    expect(
      formatPhotonFeature({
        properties: { name: 'Petaluma', city: 'Petaluma', state: 'California', country: 'United States' },
      }),
    ).toBe('Petaluma, California, United States');
  });

  it('returns an empty string for an empty feature', () => {
    expect(formatPhotonFeature({})).toBe('');
  });
});

describe('toSuggestions', () => {
  const feature = (name: string) => ({ properties: { name, country: 'France' } });

  it('dedupes identical labels and skips empty ones', () => {
    const out = toSuggestions([feature('Paris'), feature('Paris'), {}, feature('Lyon')]);
    expect(out.map((s) => s.label)).toEqual(['Paris, France', 'Lyon, France']);
  });

  it('caps the list at the limit', () => {
    const many = ['A', 'B', 'C', 'D', 'E', 'F', 'G'].map(feature);
    expect(toSuggestions(many, 5)).toHaveLength(5);
  });
});

describe('extractHouseNumber', () => {
  it('finds a leading house number', () => {
    expect(extractHouseNumber('742 Evergreen Terrace')).toBe('742');
  });

  it('accepts a letter suffix like 12b', () => {
    expect(extractHouseNumber('12b Baker Street')).toBe('12b');
  });

  it('returns null when the query does not start with a number', () => {
    expect(extractHouseNumber('Hollis Farm')).toBeNull();
  });

  it('returns null for a bare number with no street after it', () => {
    expect(extractHouseNumber('742')).toBeNull();
  });
});

describe('toSuggestions with a typed house number', () => {
  const street = {
    properties: { name: 'Evergreen Terrace', city: 'Carbondale', country: 'United States', osm_key: 'highway' },
  };
  const namedPlace = {
    properties: { name: 'Evergreen Terrace', city: 'Springfield', country: 'United States', osm_key: 'place' },
  };
  const house = {
    properties: { housenumber: '1912', street: 'Pine Street', city: 'Philadelphia', country: 'United States', osm_key: 'building' },
  };
  const poi = {
    properties: { name: 'Apple Fifth Avenue', city: 'New York', country: 'United States', osm_key: 'shop' },
  };

  it('prefixes street-level results with the typed number', () => {
    expect(toSuggestions([street], 5, '742')[0].label).toBe(
      '742 Evergreen Terrace, Carbondale, United States',
    );
  });

  it('prefixes place-type street names too', () => {
    expect(toSuggestions([namedPlace], 5, '742')[0].label).toBe(
      '742 Evergreen Terrace, Springfield, United States',
    );
  });

  it('leaves exact house matches and named places untouched', () => {
    const labels = toSuggestions([house, poi], 5, '742').map((s) => s.label);
    expect(labels).toEqual([
      '1912 Pine Street, Philadelphia, United States',
      'Apple Fifth Avenue, New York, United States',
    ]);
  });

  it('does nothing when no house number was typed', () => {
    expect(toSuggestions([street], 5, null)[0].label).toBe(
      'Evergreen Terrace, Carbondale, United States',
    );
  });
});

describe('US address formatting', () => {
  it('uses domestic format with zip and no country', () => {
    expect(
      formatPhotonFeature({
        properties: {
          housenumber: '1912', street: 'Pine Street', city: 'Philadelphia',
          state: 'Pennsylvania', postcode: '19146', country: 'United States', countrycode: 'US',
        },
      }),
    ).toBe('1912 Pine Street, Philadelphia, Pennsylvania 19146');
  });

  it('leaves the state alone when there is no zip', () => {
    expect(
      formatPhotonFeature({
        properties: { name: 'Hollis Farm', city: 'Petaluma', state: 'California', country: 'United States', countrycode: 'US' },
      }),
    ).toBe('Hollis Farm, Petaluma, California');
  });

  it('keeps the country for non-US addresses', () => {
    expect(
      formatPhotonFeature({
        properties: { name: 'Eiffel Tower', city: 'Paris', state: 'Île-de-France', country: 'France', countrycode: 'FR' },
      }),
    ).toBe('Eiffel Tower, Paris, Île-de-France, France');
  });
});

describe('two-line suggestions', () => {
  it('splits main and secondary', () => {
    const [s] = toSuggestions([
      {
        properties: {
          housenumber: '1912', street: 'Pine Street', city: 'Philadelphia',
          state: 'Pennsylvania', postcode: '19146', countrycode: 'US', country: 'United States',
        },
      },
    ]);
    expect(s.main).toBe('1912 Pine Street');
    expect(s.secondary).toBe('Philadelphia, Pennsylvania 19146');
    expect(s.label).toBe('1912 Pine Street, Philadelphia, Pennsylvania 19146');
  });

  it('keeps the typed house number in main', () => {
    const [s] = toSuggestions(
      [
        {
          properties: {
            street: 'Chapel Hill Lane', city: 'Frisco', state: 'Texas',
            postcode: '75033', countrycode: 'US', osm_key: 'highway', name: 'Chapel Hill Lane',
          },
        },
      ],
      5,
      '11417',
    );
    expect(s.main).toBe('11417 Chapel Hill Lane');
    expect(s.secondary).toBe('Frisco, Texas 75033');
  });

  it('handles single-part results', () => {
    const [s] = toSuggestions([{ properties: { name: 'Central Park', countrycode: 'US' } }]);
    expect(s.main).toBe('Central Park');
    expect(s.secondary).toBe('');
  });
});
