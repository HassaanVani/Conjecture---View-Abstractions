# Conjecture

> Interactive AP curriculum visualizations that transform abstract concepts into tangible understanding through direct manipulation.

## Overview

Conjecture is a comprehensive AP curriculum visualization platform with **130+ interactive canvas-based simulations** spanning 7 AP subjects. Every visualization features real-time physics/math, draggable objects, guided AP tutorials, and interactive controls.

## Subjects & Coverage

| Subject | Visualizations | AP Coverage |
|---------|---------------|-------------|
| Physics (all 4 AP courses) | 61 | ~90% |
| Economics (Micro + Macro) | 27 | ~70% |
| Calculus (AB + BC) | 10 | ~24% |
| Biology | 9 | ~30% |
| Chemistry | 10 | ~10% |
| Computer Science A | 8 | ~7% |
| Mathematics | 7 | — |

## Key Features

- **Direct Manipulation** — Drag pendulum bobs, aim projectiles, pull force arrows, slide conducting rods. 15+ pages with full mouse interaction on canvas objects.
- **Guided AP Tutorials** — Every page has 6-8 step demo mode walking through the AP curriculum topic with auto-setup callbacks.
- **Live Data Panels** — Real-time physics calculations displayed alongside the visualization (InfoPanel, EquationDisplay).
- **AP Curriculum Tags** — Every visualization tagged with exact AP course and unit for study alignment.
- **Code-Split Lazy Loading** — All 130+ pages lazy-loaded for fast initial bundle.
- **Responsive Canvas** — DPR-aware rendering on all screen densities.

## Tech Stack

React 19, TypeScript, Vite 7, Framer Motion, Tailwind CSS v4

## Development

```bash
npm install
npm run dev     # dev server at localhost:5173
npm run build   # production build to dist/
```

## Deployment

Deployed on Netlify. See `netlify.toml` for config.

---
*Built by Hassaan Vani*
