# TTRT UI/UX Reproduction Guide

This repo contains the standalone TTRT project-submission review cockpit UI. The committed source, assets, and `pnpm-lock.yaml` are the source of truth for reproducing the demo interface.

## Required Runtime

- Node.js 20 or newer
- pnpm 9

Install with the lockfile and do not regenerate dependencies for demo reproduction:

```powershell
pnpm install --frozen-lockfile
pnpm build
pnpm dev
```

Open:

```text
http://localhost:5175
```

## Design Contract

The app should retain the Mobility AI / TTRT enterprise design direction:

- Simple operational review cockpit, not an AI showcase
- Clear TTRT identity on every screen
- Review queues, project details, AI recommendations, comments, signatures, and decision actions presented with the shared Mobility AI visual language
- AI-generated text and AI recommendations clearly labelled
- Maximum four meaningful overview KPIs
- No simplified process map unless explicitly reintroduced
- Comprehensive English and Arabic translation support for TTRT-visible labels and flows

## Embedded Platform Use

When reproducing the full platform demo, run this app on port `5175` and run the Mobility AI master platform on `http://localhost:8280`. The platform can embed TTRT through the configured app URL.
