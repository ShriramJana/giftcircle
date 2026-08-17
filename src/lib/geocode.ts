/**
 * Location search via Photon (photon.komoot.io), an OpenStreetMap-based
 * geocoder built for autocomplete. Free for fair use, no API key. Swap the
 * endpoint for a keyed provider (Google Places, Mapbox) if search volume
 * ever outgrows it.
 */

export interface PhotonFeature {
  properties?: {
    name?: string;
    street?: string;
    housenumber?: string;
    city?: string;
    state?: string;
    country?: string;
    countrycode?: string;
    postcode?: string;
    /** OSM class, e.g. "highway" for streets, "building" for houses. */
    osm_key?: string;
  };
}

export interface LocationSuggestion {
  /** Full stored value, e.g. "1912 Pine Street, Philadelphia, Pennsylvania 19146". */
  label: string;
  /** First line of the dropdown row: venue or street. */
  main: string;
  /** Second, softer line: city and region. May be empty. */
  secondary: string;
}

function partsOfPhotonFeature(feature: PhotonFeature): string[] {
  const p = feature.properties ?? {};
  const street = [p.housenumber, p.street].filter(Boolean).join(' ');
  const isUS = p.countrycode === 'US';
  const statePart = isUS && p.state && p.postcode ? `${p.state} ${p.postcode}` : p.state;
  const parts: string[] = [];
  for (const part of [p.name || street, p.city, statePart, isUS ? null : p.country]) {
    if (part && !parts.includes(part)) parts.push(part);
  }
  return parts;
}

/**
 * US addresses use the domestic format with the zip and no country:
 * "1912 Pine Street, Philadelphia, Pennsylvania 19146". Everywhere else:
 * "name, city, state, country".
 */
export function formatPhotonFeature(feature: PhotonFeature): string {
  return partsOfPhotonFeature(feature).join(', ');
}

/** The house number the user typed at the start of their query, if any. */
export function extractHouseNumber(query: string): string | null {
  const match = query.trim().match(/^(\d+[a-z]?)\s+\S/i);
  return match ? match[1] : null;
}

/**
 * Format, drop empties, dedupe, cap the list. When the user typed a house
 * number but a result is only street-level (OSM does not map every house),
 * keep their number in front of the street so picking a suggestion never
 * loses part of the address.
 */
export function toSuggestions(
  features: PhotonFeature[],
  limit = 5,
  typedHouseNumber: string | null = null,
): LocationSuggestion[] {
  const seen = new Set<string>();
  const out: LocationSuggestion[] = [];
  for (const feature of features) {
    const parts = partsOfPhotonFeature(feature);
    if (parts.length === 0) continue;
    const p = feature.properties ?? {};
    // Streets arrive as "highway", but named streets and subdivisions also
    // come back as "place" or "landuse". Named POIs and buildings keep
    // their own identity and are never prefixed.
    const streetish = p.osm_key === 'highway' || p.osm_key === 'place' || p.osm_key === 'landuse';
    if (typedHouseNumber && !p.housenumber && streetish) {
      parts[0] = `${typedHouseNumber} ${parts[0]}`;
    }
    const label = parts.join(', ');
    if (seen.has(label)) continue;
    seen.add(label);
    out.push({ label, main: parts[0], secondary: parts.slice(1).join(', ') });
    if (out.length >= limit) break;
  }
  return out;
}
