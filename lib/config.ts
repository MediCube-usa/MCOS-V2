// Public, client-side keys. All three are designed to be exposed in the browser
// and are protected by restriction, not secrecy:
//   - Google Maps key: locked to the *.vercel.app/* referrer in Google Cloud.
//   - Supabase publishable key: guarded by row-level-security policies on the DB.
// They fall back to env vars so they can be rotated without a code change.

export const GOOGLE_MAPS_KEY =
  process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || 'AIzaSyDCNIOuS0h9xsa3b0_5uXehq-r7FQHXUBk';

export const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://negtepvmbkyefvxiakwu.supabase.co';

export const SUPABASE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_Jdnbraiy3U6XiHK48La_Tw_-ODoc6CQ';
