# api/dana.js — the live Dana Lestari figure

## What it does

The counter on the homepage is **two campaign pages added together**:

| Page | What is taken from it |
|---|---|
| `inspirasiberbagi.itb.ac.id/SBM_UM26` | the whole "Terkumpul" figure — that page is entirely SBMRC's |
| `inspirasiberbagi.itb.ac.id/ITBUM26` | **only** the `SBMRC - SBM ITB` line on its community leaderboard |

The second one matters. ITBUM26 is the ITB-wide campaign and its total runs into
tens of millions belonging to Laskar ITB 79, Taksu Bali and the rest. Taking
that total would be claiming other people's money. The file is written to read
one leaderboard line and nothing else.

A patron can now give through either link and the site picks it up.

Both reads happen on Vercel's server, because ITB's site does not permit
browsers on other domains to read it.

## Where the file goes

In the repository, at the top level, in a folder called `api`:

```
sbmrc-site/
  index.html
  assets/
  api/
    dana.js      <- this file
```

The folder must be named exactly `api`. Vercel looks for that name.

## How to check it

Open this in a browser:

    https://sbmrc.sbm-itb.ac.id/api/dana

**Working** — you will see the two figures broken out:

    {"donations":2932000,
     "breakdown":{"sbm":1300000,"itb":1632000},
     "matchedItbBy":"community name",
     "source":"live","fetchedAt":"2026-10-04T..."}

Compare `breakdown.itb` against the SBMRC line on the ITBUM26 leaderboard and
`breakdown.sbm` against the Terkumpul figure on SBM_UM26. They should match.

**Not working** — `"source":"unavailable"` and a `reason` saying which page
failed. The website is unaffected: it falls back to the fixed number in its
config and no visitor sees anything wrong.

Note it only refreshes every 10 minutes, so a brand-new donation will not appear
instantly.

## Why a failure on one page blanks both

If ITBUM26 could not be read, reporting the SBM figure alone would make the
public counter **drop** by the missing amount. Rather than show a number that
has gone backwards, the file reports nothing and the site keeps its last known
good figure. That is deliberate.

## If the ITB-wide campaign is retired

Open `dana.js`, find this line near the top, and change `true` to `false`:

```js
const USE_ITB_PAGE = true;
```

The site then counts the SBM page only. Before doing that, add whatever the
ITBUM26 leaderboard last showed into `offline:` in `index.html`, or that history
disappears from the total.

## The numbers in index.html

Search for `offline:` and you will find:

```js
    raised:      2932000,          // the figure shown if the live one can't be read
    offline:     0,                // gifts that reach NEITHER campaign page
```

`offline` is now zero because both pages are read live. Use it only for a gift
that arrives some other way — a direct transfer, say. `raised` is the safety net
for when a live read fails; keep it roughly level with the real total so the
fallback never looks badly out of date.

To switch the live reading off entirely, set `liveUrl: ""`.

## If ITB redesigns their pages

The file looks for the words `Terkumpul ( Rp ... )` on one page and
`SBMRC - SBM ITB ... Rp ...` on the other. If either wording changes,
`/api/dana` starts reporting `"source":"unavailable"` and the site falls back.
Nothing breaks — but the counter stops moving on its own, so it is worth opening
that URL now and then.
