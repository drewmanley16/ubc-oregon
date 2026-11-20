# Design — lane B

Figma links, token decisions, component notes. Source of truth is the code (`apps/web/app/globals.css`, `components/`).

## Tokens (Nov 20) — source: `apps/web/app/globals.css` `:root`
| Token | Value | Use |
|---|---|---|
| `--s-paper` | `#F7F8F6` | page |
| `--s-surface` | `#FFFFFF` | cards, sheets |
| `--s-ink` | `#0E1110` | text, primary CTA |
| `--s-muted` | `#5D6662` | secondary text (5.56:1 on paper) |
| `--s-line` | `#E3E7E4` | dividers |
| `--s-save` / `--s-save-soft` | `#0A7A45` / `#E3F3EA` | the ONE savings accent |
| `--s-alert` / `--s-alert-soft` | `#B42318` / `#FCEBE9` | errors |
| radii | 10 / 14 / 22px | |
| type (Figtree) | price 96/800 · offer price 54 · landing 44 · page 30 · amount 52 · body 15 · fine 11–11.5 | |
| motion | `--m-out`, `--m-spring`, `--m-in`; all off under `prefers-reduced-motion` | |

Rule: make secondary text quiet with `--s-muted`, never with `opacity` — opacity on muted text drops below AA (3.0–3.3:1).
