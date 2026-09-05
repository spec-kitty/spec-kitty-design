<!--
  A REAL SFC, compiled by vue-tsc — the consumer's altitude (#81).

  WHAT THIS FILE PROVES, precisely: that Volar resolves the `GlobalComponents` augmentation from a
  TEMPLATE. Everything else about the generated declarations is checked by `tsconfig.vue.json`'s
  `skipLibCheck: false`, which compiles `packages/elements/vue.d.ts` in full whether or not any tag
  here names an element.

  AN EARLIER REVISION LISTED ALL FOURTEEN TAGS and a gate asserted that coverage. A lens measured
  what those lines actually did, and the answer is nothing: vue-tsc SILENTLY ACCEPTS an element that
  is not in GlobalComponents at all (`<sk-totally-not-declared>` compiles clean), and silently
  accepts an undeclared attribute on a declared one (fallthrough attrs). So naming a tag could not
  detect a dropped element, and the coverage assertion enforced a property that does not hold.
  Verified the other way too: a bad declaration inside vue.d.ts is caught by skipLibCheck whether or
  not the template mentions that element.

  That listing was itself an over-correction of mine, made earlier in the same review when a lens
  pointed out that skipLibCheck was hiding twelve declarations. The fix that mattered was turning
  skipLibCheck off. The fourteen tags were theatre on top of it.
-->
<template>
  <sk-button variant="primary">Save</sk-button>
  <sk-pill-tag variant="green">Ready</sk-pill-tag>
  <sk-site-footer :legal="legal" />
  <sk-transition-matrix :columns.prop="columns" :routes.prop="routes" />
</template>

<script setup lang="ts">
import type { TransitionColumn, TransitionRoute } from '@spec-kitty/elements';

const legal = '© 2026 Example';
const columns = Object.freeze([
  Object.freeze({ id: 'fri-4', label: 'Today · Fri 4' }),
] satisfies ReadonlyArray<TransitionColumn>);
const routes = Object.freeze([
  Object.freeze({
    id: 'planned-progress',
    label: 'Planned → In progress',
    tone: 'forward',
    values: Object.freeze({ 'fri-4': 5 }),
  }),
] satisfies ReadonlyArray<TransitionRoute>);
</script>
