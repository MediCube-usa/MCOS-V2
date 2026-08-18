// Reachability probe: can the deployed app's server reach OurVend at all?
// This is the one unknown before wiring the live reader — OurVend sits behind an
// Alibaba bot-wall, and a server-origin request may be treated differently than a
// browser. No cookie, no writes — just a plain GET to the login page to see what
// comes back. Visit /api/ourvend/ping in the browser to read the result.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const started = Date.now();
  try {
    const r = await fetch('https://os.ourvend.com/Account/Login', {
      method: 'GET',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      },
      redirect: 'manual',
      signal: AbortSignal.timeout(15000)
    });
    const text = await r.text().catch(() => '');
    const looksLikeLogin = /login|account|password|os\.ourvend/i.test(text);
    return Response.json({
      reachable: true,
      status: r.status,
      ms: Date.now() - started,
      bytes: text.length,
      looksLikeOurVendLogin: looksLikeLogin,
      snippet: text.slice(0, 300)
    });
  } catch (e) {
    return Response.json(
      {
        reachable: false,
        ms: Date.now() - started,
        error: e instanceof Error ? e.message : String(e),
        meaning: 'Vercel could not open a connection to OurVend — same wall as the sandbox.'
      },
      { status: 200 }
    );
  }
}
