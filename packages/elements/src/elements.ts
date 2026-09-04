// IIFE entry (ADR-10 §2): self-contained, carries the Lit runtime, loadable from
// file:// and over HTTP with an integrity hash. Importing for side effects
// registers every element via the guarded define().
//
// HAND-MAINTAINED, AND CHECKED. scripts/check-elements-entries.mjs derives the element list
// from the source tree and fails if one is missing from here or from index.ts. #73 added
// sk-nav-pill to index.ts and not to this file, and every gate stayed green — the vitest lane
// resolves the package to index.ts, the analyzer reads source, and Storybook has its own
// module graph. Only the deployed demo went quiet.
import './stub/sk-stub.js';
import './button/sk-button.js';
import './card/sk-card.js';
import './nav-pill/sk-nav-pill.js';
import './form-input/sk-form-input.js';
import './form-textarea/sk-form-textarea.js';
import './grid/sk-grid.js';
import './feature-card/sk-feature-card.js';
import './ribbon-card/sk-ribbon-card.js';
import './pill-tag/sk-pill-tag.js';
import './section-banner/sk-section-banner.js';
