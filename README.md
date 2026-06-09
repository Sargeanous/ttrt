# TTRT Review Cockpit

Internal Abu Dhabi Mobility project-submission review cockpit for the Technical Architecture Review Team.

The app models the TTRT flow from project submission through initial screening, technical review, comment consolidation, PM response, final recommendation, signatures, ED approval, and archive.

## Run locally

```bash
pnpm install
pnpm dev
```

Open `http://localhost:5175`.

Demo sign-in:

- Email: `admin@itc.local`
- Password: `ChangeMe!2026`
- Tenant: `default`

## Business surfaces

- `Overview`: current process step, tracking KPIs, review queue, SLA pressure, evidence gaps, and next actions.
- `Submissions`: one workspace per project package, including details, checks, AI opinion, and decision actions.
- `Review Board`: TTRT member comments and consolidated recommendations.
- `Signatures`: signature-chain tracking and ED approval readiness.
- `Rules`: editable business rules for completeness, circulation, comments, signatures, and decisions.
- `Reports`: generated TTRT reports, PM clarification emails, signature reminders, and weekly latency views.
