import { NextResponse, type NextRequest } from 'next/server';
import { extractHouseNumber, toSuggestions, type PhotonFeature } from '@/lib/geocode';

/**
 * Server-side proxy for location autocomplete, so the browser talks only to
 * our origin and the provider can be swapped without touching the client.
 *
 * Results are biased toward the visitor's own area: on Vercel the request
 * carries IP-derived coordinates; locally (or when the headers are absent)
 * we fall back to GEOCODE_BIAS_LAT/LON, defaulting to the continental US.
 * Bias reorders ranking only; explicit queries ("Paris, France") still win.
 */

const DEFAULT_BIAS_LAT = '39.83';
const DEFAULT_BIAS_LON = '-98.58';

function biasCoords(request: NextRequest): { lat: string; lon: string } {
  const ipLat = request.headers.get('x-vercel-ip-latitude');
  const ipLon = request.headers.get('x-vercel-ip-longitude');
  if (ipLat && ipLon) {
    const lat = Number(ipLat);
    const lon = Number(ipLon);
    if (Number.isFinite(lat) && Number.isFinite(lon)) {
      // Rounded to ~1 km: enough to rank nearby streets first without
      // sending the visitor's precise location upstream.
      return { lat: lat.toFixed(2), lon: lon.toFixed(2) };
    }
  }
  return {
    lat: process.env.GEOCODE_BIAS_LAT ?? DEFAULT_BIAS_LAT,
    lon: process.env.GEOCODE_BIAS_LON ?? DEFAULT_BIAS_LON,
  };
}

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q')?.trim() ?? '';
  if (q.length < 3 || q.length > 120) {
    return NextResponse.json({ suggestions: [] });
  }

  const { lat, lon } = biasCoords(request);

  try {
    const res = await fetch(
      `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=6&lang=en` +
        `&lat=${lat}&lon=${lon}&location_bias_scale=0.6&zoom=8`,
      {
        headers: { 'User-Agent': 'GiftCircle (event registry MVP)' },
        signal: AbortSignal.timeout(4000),
        next: { revalidate: 86400 },
      },
    );
    if (!res.ok) return NextResponse.json({ suggestions: [] });

    const data = (await res.json()) as { features?: PhotonFeature[] };
    return NextResponse.json(
      { suggestions: toSuggestions(data.features ?? [], 5, extractHouseNumber(q)) },
      // Private: responses depend on the visitor's location, so they must
      // not be shared through a CDN cache. Upstream lookups are still
      // cached per query + rounded coordinates by the fetch data cache.
      { headers: { 'Cache-Control': 'private, max-age=300' } },
    );
  } catch {
    // Provider slow or unreachable; the field still works as free text.
    return NextResponse.json({ suggestions: [] });
  }
}
