# api/dana.js — the live Dana Lestari figure

## What it does

The counter on the homepage adds two numbers together:

```
  donations read live from inspirasiberbagi.itb.ac.id/SBM_UM26
+ offline   (merchandise cut and anything not on that page)
= the figure shown on the site
```

`dana.js` is what reads the first number. It runs on Vercel's server, not in the
visitor's browser, because ITB's site does not permit browsers on other domains
to read it.

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

## How to check it worked

After Vercel finishes building, open this in a browser:

    https://sbmrc.sbm-itb.ac.id/api/dana

**Working** — you will see something like:

    {"donations":1300000,"source":"live","fetchedAt":"2026-10-04T09:12:44.102Z"}

**Not working** — you will see `"source":"unavailable"` and a `reason` saying
what went wrong. The website is unaffected: it falls back to the fixed number in
its config block and no visitor sees anything broken.

**404 page not found** — the site is being served by GitHub Pages rather than
Vercel. GitHub Pages cannot run this. Everything still works; the counter just
stays on its fixed number.

## The one number you still maintain by hand

Open `index.html`, search for `offline:` and you will find:

```js
    raised:      2932000,          // the figure shown if the live one can't be read
    offline:     1632000,          // merch cut + anything NOT on the campaign page
```

`offline` is merchandise income and any gift that did not come through the
campaign page. Change it when that part grows. `raised` is only the safety net
for when the live read fails — keep it roughly equal to `offline` plus whatever
the campaign page currently shows.

To switch the live reading off entirely, set `liveUrl: ""`.

## If ITB redesigns their page

The function looks for the words `Terkumpul ( Rp ... )`. If that wording
changes, `/api/dana` starts reporting `"source":"unavailable"` and the site
falls back. Nothing breaks — but the counter stops moving on its own, so it is
worth opening that URL occasionally.
