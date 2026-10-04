// SBMRC 2026 — live Dana Lestari figure
//
// The public total is two campaign pages added together:
//
//   SBM_UM26  SBM ITB's own page. Its "Terkumpul" figure is entirely SBMRC's.
//   ITBUM26   The ITB-wide campaign. Its total belongs to every ITB community,
//             so we take ONLY the SBMRC line from its leaderboard. Never the
//             page total — that would claim tens of millions that are not ours.
//
// Both reads happen here, on Vercel's server, because ITB's site does not allow
// browsers on other domains to read it.
//
// Lives in the repo at:  api/dana.js
// Served at:             https://sbmrc.sbm-itb.ac.id/api/dana
//
// Open that URL in a browser to check it:
//   {"donations":2932000,"breakdown":{"sbm":1300000,"itb":1632000},"source":"live",...}
//
// If EITHER page cannot be read, it returns donations:null and the website
// quietly keeps the fixed number in its config block. That is deliberate: a
// half-read must never make the public counter appear to drop.

const SBM_PAGE = 'https://inspirasiberbagi.itb.ac.id/SBM_UM26';
const ITB_PAGE = 'https://inspirasiberbagi.itb.ac.id/ITBUM26';

// Set to false if the ITB-wide campaign is ever retired, or if SBMRC leaves its
// leaderboard. The site then counts the SBM page only.
const USE_ITB_PAGE = true;

function plainText(html) {
  // strip the tags first, so markup between the words cannot break a match
  return String(html).replace(/<[^>]+>/g, ' ').replace(/&nbsp;/gi, ' ');
}

function toRupiah(raw) {
  // Indonesian writes '.' for thousands and ',' for decimals, so drop anything
  // from the comma onward before removing the separators
  const comma = raw.indexOf(',');
  const whole = comma === -1 ? raw : raw.slice(0, comma);
  const n = parseInt(whole.replace(/[^\d]/g, ''), 10);
  // a ceiling, so a change in their formatting can never inflate the counter
  return Number.isFinite(n) && n > 0 && n < 1e11 ? n : null;
}

// SBM_UM26 — the headline figure:  Terkumpul ( Rp 1.300.000 )
function readSbmTotal(html) {
  const m = plainText(html).match(/Terkumpul[^\d]{0,40}?Rp[\s.]{0,4}([\d.,]+)/i);
  return m ? toRupiah(m[1]) : null;
}

// ITBUM26 — SBMRC's own line on the community leaderboard:
//   5   SBMRC - SBM ITB   Rp. 1.632.000
function readItbShare(html) {
  const text = plainText(html);
  // Match the FULL community name only. Looking for a bare "SBMRC" would also
  // hit a donor who typed it in their message, and take that donation's amount
  // instead — a wrong number that still looks plausible. Better to find nothing
  // and let the site fall back. [-\u2013\u2014] covers hyphen and both dashes.
  const m = text.match(/SBMRC\s*[-\u2013\u2014]?\s*SBM\s*ITB[^\d]{0,60}?Rp[\s.]{0,4}([\d.,]+)/i);
  if (m) return { value: toRupiah(m[1]), matched: 'community name' };

  return { value: null, matched: 'none' };
}

async function grab(url) {
  const r = await fetch(url, {
    headers: { 'User-Agent': 'SBMRC-site/1.0 (+https://sbmrc.sbm-itb.ac.id)' },
    signal: AbortSignal.timeout(8000),
  });
  if (!r.ok) throw new Error(url + ' returned HTTP ' + r.status);
  return r.text();
}

module.exports = async (req, res) => {
  // let the website read this, from any of its addresses
  res.setHeader('Access-Control-Allow-Origin', '*');
  // serve a cached copy for 10 minutes, so we stay gentle on ITB's servers
  res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate=3600');

  try {
    const [sbmHtml, itbHtml] = await Promise.all([
      grab(SBM_PAGE),
      USE_ITB_PAGE ? grab(ITB_PAGE) : Promise.resolve(''),
    ]);

    const sbm = readSbmTotal(sbmHtml);
    if (sbm === null) throw new Error('could not find the Terkumpul figure on SBM_UM26');

    let itb = 0;
    let matched = 'skipped';
    if (USE_ITB_PAGE) {
      const found = readItbShare(itbHtml);
      matched = found.matched;
      if (found.value === null) {
        throw new Error('could not find the SBMRC line on the ITBUM26 leaderboard');
      }
      itb = found.value;
    }

    res.status(200).json({
      donations: sbm + itb,
      breakdown: { sbm: sbm, itb: itb },
      matchedItbBy: matched,
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

// exported so the parsers can be tested on their own
module.exports.readSbmTotal = readSbmTotal;
module.exports.readItbShare = readItbShare;
