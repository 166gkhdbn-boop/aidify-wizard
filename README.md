# 🧙 REN Wizard

A standalone wizard to deploy your own **REN Gateway** proxy panel in one click — inspired by [BPB-Wizard](https://github.com/bia-pain-bache/BPB-Wizard).

This project deploys the panel package [`166gkhdbn-boop/aidify-panel`](https://github.com/166gkhdbn-boop/aidify-panel) to **your own** Wasmer account and provisions a **free database** for it automatically.

## Web edition

To deploy your own panel:

```
https://aidify-wizard.wasmer.app
```

## How it works

1. **Wasmer token** — paste your token from [wasmer.io](https://wasmer.io) (validated live, never stored)
2. **Database token** — the wizard creates a free database project for your panel automatically
3. **Panel details** — choose your app name and panel password
4. **Deploy** — one click; the wizard creates the app, sets secrets, and redeploys

## Privacy

- Your tokens are used transiently during deployment only — never stored, never logged
- The wizard itself is stateless and keeps no data
- Fully open-source

## Tech

WinterJS on Wasmer Edge. `node build.js` inlines `src/deploy.html` into `app/app.js`; bump `version` in `wasmer.toml` before each `wasmer deploy`.
