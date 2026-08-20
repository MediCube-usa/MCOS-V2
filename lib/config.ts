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

// Legacy anon JWT — also publishable, also RLS-guarded. The edge function is
// deployed with verify_jwt=true, and that check wants a real JWT, so the
// "Refresh from OurVend" button authorizes with this rather than the newer
// sb_publishable_ key.
export const SUPABASE_ANON_JWT =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_JWT ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5lZ3RlcHZtYmt5ZWZ2eGlha3d1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU5OTAyMDYsImV4cCI6MjEwMTU2NjIwNn0.lxxt_mJfYCLCyc3v_h_2qHqZuBnt2GTZ28HfuIhhRIM';

// The MediCube ops Google Calendar (the "Medi Cube" account Joe created for
// the business — NOT his personal account; no password anywhere, the ID is
// just the address). The real Google Calendar grid renders dark in the
// Command Center corner box and on /calendar. Requires the calendar to be
// set "Make available to public" inside that account, or browsers not signed
// into it see an empty box.
export const GCAL_EMBED_ID = process.env.NEXT_PUBLIC_GCAL_ID || 'medicubehub1@gmail.com';

// The permanent, cloud-side OurVend fleet reader (Supabase Edge Function).
// It reads the OurVend cookie from the RLS-locked secrets table server-side,
// pulls every stocked slot, and writes live_slots. pg_cron runs it every ~20
// min; the dashboard button hits the same URL for an on-demand refresh.
export const OURVEND_REFRESH_URL =
  process.env.NEXT_PUBLIC_OURVEND_REFRESH_URL ||
  `${SUPABASE_URL}/functions/v1/ourvend-refresh`;
