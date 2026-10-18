# 🧙 REN Wizard

A standalone wizard to deploy your own **REN Gateway** proxy panel — inspired by [BPB-Wizard](https://github.com/bia-pain-bache/BPB-Wizard).

This project deploys the panel package [`166gkhdbn-boop/aidify-panel`](https://github.com/166gkhdbn-boop/aidify-panel) to **your own** Wasmer account.

## Web edition

The wizard lives right here on GitHub Pages — no server, everything runs in your browser:

```
https://166gkhdbn-boop.github.io/aidify-wizard/
```

## How it works

1. **Wasmer token** — paste your token from [wasmer.io](https://wasmer.io) (validated live via the Wasmer API)
2. **Database** — create a free project at [supabase.com](https://supabase.com), run the provided SQL once, paste your project URL + service_role key (verified live)
3. **Panel details** — choose your app name and panel password
4. **Deploy** — one click; the wizard publishes the panel to your Wasmer account and saves the secrets

## Privacy

- Your tokens and keys never leave your browser except to the official Wasmer/Supabase APIs — nothing is stored anywhere
- The wizard is a single static page: no backend, no tracking
- Fully open-source
