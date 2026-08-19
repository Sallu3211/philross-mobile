/**
 * contactInfo — Phil's published phone and email, fetched once and shared.
 *
 * Two screens need this now: the Contact page, and the "Call to order" button
 * on a product. Fetching it in each place would mean two requests and two
 * chances to drift apart, so it lives here.
 *
 * The endpoint returns `phone_number`, not `phone`. ContactScreen used to read
 * `phone` and silently fall through to its hardcoded constant every time —
 * harmless only because the two happened to match. Both keys are accepted here
 * so a rename on either side cannot reintroduce that.
 */

const ENDPOINT = 'https://api.philross.com/sitecontent/contact-info/';

/** Used until the request lands, and if it never does. */
export const FALLBACK_PHONE = '(551) 364-2545';
export const FALLBACK_EMAIL = 'info@philross.com';

export interface ContactInfo {
  phone: string;
  email: string;
  address?: string;
}

let cached: ContactInfo | null = null;
let inFlight: Promise<ContactInfo> | null = null;

/** Strips everything a dialler cannot use: "(551) 364-2545" -> "5513642545". */
export const dialable = (phone: string): string => phone.replace(/[^\d+]/g, '');

export async function getContactInfo(): Promise<ContactInfo> {
  if (cached) return cached;
  // Concurrent callers share one request rather than racing.
  if (inFlight) return inFlight;

  inFlight = (async () => {
    try {
      const res = await fetch(ENDPOINT);
      const json = await res.json();
      const d = json?.data ?? {};
      cached = {
        phone: d.phone_number || d.phone || FALLBACK_PHONE,
        email: d.email || FALLBACK_EMAIL,
        address: d.address || undefined,
      };
    } catch {
      cached = { phone: FALLBACK_PHONE, email: FALLBACK_EMAIL };
    } finally {
      inFlight = null;
    }
    return cached!;
  })();

  return inFlight;
}

export default getContactInfo;
