// SBMRC 2026 — live Dana Lestari figure
//
// The browser cannot read inspirasiberbagi.itb.ac.id directly: that site sends
// no Access-Control-Allow-Origin header, so Chrome blocks the response. This
// function does the read server-side, where that rule does not apply, and hands
// the website back a single number.
//
// Lives in the repo at:  api/dana.js
// Served at:             https://sbmrc.sbm-itb.ac.id/api/dana
//
// Open that URL in a browser to check it. You should see something like:
//   {"donations":1300000,"source":"live","fetchedAt":"2026-10-04T..."}
//
// If anything goes wrong it returns donations:null and the website quietly keeps
// the fixed number in its config block. Nothing on the page breaks.

const PAGE = 'https://inspirasiberbagi.itb.ac.id/SBM_UM26';

// pulled out so it can be tested on its own
function readTerkumpul(html) {
  // strip the HTML tags first, so markup between the words cannot break the match
  const text = String(html)
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ');

  // matches:  Terkumpul ( Rp 1.300.000 )
  const m = text.match(/Terkumpul[^\d]{0,40}?Rp[\s.]{0,4}([\d.,]+)/i);
  if (!m) return null;

  // Indonesian uses '.' for thousands and ',' for decimals, so drop anything
  // from the comma onward before removing the separators
  let raw = m[1];
  const comma = raw.indexOf(',');
  if (comma !== -1) raw = raw.slice(0, comma);

  const n = parseInt(raw.replace(/[^\d]/g, ''), 10);
  // a ceiling, so a future change in their formatting can never inflate the
  // public counter by a factor of a hundred
  return Number.isFinite(n) && n > 0 && n < 1e11 ? n : null;
}

module.exports = async (req, res) => {
  // let the website read this, from any of its addresses
  res.setHeader('Access-Control-Allow-Origin', '*');
  // serve a cached copy for 10 minutes, so we stay gentle on ITB's server
  res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate=3600');

  try {
    const r = await fetch(PAGE, {
      headers: { 'User-Agent': 'SBMRC-site/1.0 (+https://sbmrc.sbm-itb.ac.id)' },
      signal: AbortSignal.timeout(8000),
    });
    if (!r.ok) throw new Error('page returned HTTP ' + r.status);

    const donations = readTerkumpul(await r.text());
    if (donations === null) throw new Error('could not find the Terkumpul figure on the page');

    res.status(200).json({
      donations: donations,
      source: 'live',
      fetchedAt: new Date().toISOString(),
    });
  } catch (e) {
    // 200, not an error code: the website checks the "donations" field, and a
    // failure here must never surface as a broken page to a visitor
    res.status(200).json({
      donations: null,
      source: 'unavailable',
      reason: String((e && e.message) || e),
    });
  }
};

module.exports.readTerkumpul = readTerkumpul;
