// IIFE entry (ADR-10 §2): self-contained, carries the Lit runtime, loadable from
// file:// and over HTTP with an integrity hash. Importing for side effects
// registers every element via the guarded define().
import './stub/sk-stub.js';
import './card/sk-card.js';
