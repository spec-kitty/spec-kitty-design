<!--
  A REAL SFC, compiled by vue-tsc — the consumer's altitude (#81).

  EVERY element, not a sample. A lens found that `tsconfig.base.json` sets `skipLibCheck: true` and
  that this file exercised three of fourteen, so twelve generated declarations shipped unverified —
  an unknown type inside `vue.d.ts` raised nothing. `tsconfig.vue.json` now turns `skipLibCheck`
  off, and this template names all 14 so a bad declaration anywhere in the generated file
  is a compile error here.

  GENERATED-ADJACENT BUT HAND-WRITTEN, deliberately: if this list were derived from the same
  manifest the types are, both sides would shrink together and the check would be a tautology —
  the defect build-react-wrappers.mjs records at length. `check-vue-template-types.mjs` asserts the
  count against the manifest instead, so a new element fails here until someone adds it.
-->
<template>
  <sk-blog-card />
  <sk-button />
  <sk-card />
  <sk-check-bullet />
  <sk-feature-card />
  <sk-form-input />
  <sk-form-textarea />
  <sk-grid />
  <sk-nav-pill />
  <sk-pill-tag />
  <sk-ribbon-card />
  <sk-section-banner />
  <sk-site-footer />
  <sk-stub />
  <sk-button variant="primary">Save</sk-button>
  <sk-pill-tag variant="green">Ready</sk-pill-tag>
  <sk-site-footer :legal="legal" />
</template>

<script setup lang="ts">
const legal = '© 2026 Example';
</script>
