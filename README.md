# ASCENT Protocol — website & app

The multi-chain wealth engine. Static site + dapp shell, no build step:
the repo root **is** the site.

## Structure

```
index.html     home, ecosystem, token, community + the app (dashboard,
               launchpad, swap & bridge, staking, governance)
css/app.css    brand implementation — #6C5CFF / #00E0FF on #0D0F1A, Satoshi type
js/config.js   network + contract addresses (preview-mode switch lives here)
js/app.js      navigation, charts, wallet connect, demo data, forms
vendor/        ethers v6.15.0, vendored (no CDN dependency)
```

## Run locally

```bash
python3 -m http.server 8901
# open http://localhost:8901
```

## Preview mode → live mode

While `js/config.js` contract addresses are empty the app runs in preview
mode: simulated figures, banner shown, transactions disabled. Paste the
deployed addresses to go live — no other changes needed.

Wallet connect targets Robinhood Chain Testnet (chain id 46630) by default;
Ethereum/Solana routing is stubbed in the UI pending bridge contracts.

## Deploy

Any static host (Cloudflare Pages / Vercel / GitHub Pages):
build command *none*, output directory `/` (repo root). Point the custom
domain at the host and every push redeploys automatically.
