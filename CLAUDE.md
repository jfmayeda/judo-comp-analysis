Standing rules for agents working on this repo.

Privacy rules for minors are in [README.md](README.md) (Privacy Rules) and [FAMILY_LOGIN_DESIGN.md](FAMILY_LOGIN_DESIGN.md).

## Design from the current code

The running code is the source of truth for UI, not a separate design file; the current look is in [DESIGN.md](DESIGN.md) and `app/globals.css` (mirrored by `tailwind.config.ts`).

When designing or changing a screen:

1. Read the relevant components, tokens, and styles first.
2. Recreate or describe the current UI from that code before proposing changes.
3. Then riff. Keep the previous version around for comparison.
4. Implement in the same thread that did the design work.

Don't maintain a long-running mock that has to stay in sync with the repo.

## Anti-slop: known failure modes

You don't know your own visual biases. In a fresh session you'll often produce the same default look: serif or Inter-like type, off-white backgrounds, orange or purple accents, decorative bars on card edges.

Don't use those unless asked or they already exist in this repo's tokens (`app/globals.css`, [DESIGN.md](DESIGN.md) §1).

Follow this product's existing type, color, density, and motion ([DESIGN.md](DESIGN.md) §1–§2 and `app/globals.css`). If there's no look yet, propose several distinct directions instead of one confident style.

## Explore, then build

Don't one-shot a new screen, flow, or deck in a single style.

For new UI: produce 8–10 distinct options first. If the layout is hard, start with wireframes and study familiar products in the same category.

Then remix the best parts into a smaller second round. Lock the look before building the full feature.

For an existing product, recreate the current UI from code first, then riff.
