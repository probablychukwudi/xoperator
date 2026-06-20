# Contributing to xoperator

Thanks for helping improve xoperator.

## Development

Install dependencies:

```bash
npm install
```

Run locally:

```bash
npm run dev
```

Run checks before opening a pull request:

```bash
npm run build
npm run test:e2e
npm audit --audit-level=moderate
```

## Pull Request Guidelines

- Keep changes focused.
- Match the existing React, Tailwind, and Zustand patterns.
- Add or update Playwright coverage for user-facing workflows.
- Include screenshots for visible UI changes when helpful.
- Do not commit local secrets, private calendars, personal app data, `node_modules`, or build output.

## Design Principles

- Local-first by default.
- Founder workflows before generic productivity features.
- Clear loading, empty, and error states.
- Customization should change real workflows, not just preferences.
- Keep the UI dense, calm, and scannable.
