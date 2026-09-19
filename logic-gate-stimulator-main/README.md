# Logic//Lab

A polished, client-only logic gate simulator and truth table generator. The circuit state persists as you move between Mission Briefing, Lab Workspace, and Matrix Decoder.

## Included

- Interactive input toggles with live HIGH/LOW propagation.
- AND, OR, NOT, NAND, NOR, XOR, and XNOR gates.
- Terminal LED outputs.
- Click an output pin, then an input pin to create a snapped wire.
- Animated signal flow on active wires.
- Truth-table generation for every `2ⁿ` input permutation.
- CSV export for the current matrix.
- Responsive layout for desktop and mobile.

## Run locally

```bash
pnpm install
pnpm dev
```

## Build for GitHub Pages

```bash
pnpm build
```

The static client output is generated under `dist/public`. Publish that directory with GitHub Pages (for example, using the official GitHub Pages action or the `gh-pages` package). If you prefer a no-build workflow, copy the `client` directory into a Vite-compatible GitHub repository and run the same build command in GitHub Actions.

## Academic code separation

The main app includes highly visible comment markers for the two requested contribution areas:

- `PART A: MULTI-PAGE NAV & GAMIFIED USER GUIDE INTERFACE`
- `PART B: CORE CIRCUITS & AUTOMATED TRUTH MATRIX ALGORITHM`

## License

MIT
