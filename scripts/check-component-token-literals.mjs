#!/usr/bin/env node

/**
 * Reject raw design-bearing values in explicitly named component stylesheets.
 *
 * This complements stylelint's repository-wide rules with a fail-closed, parsed check for the
 * complete property classes required by component missions. CSS-wide values, zero, percentages,
 * layout keywords, and forced-colour system colours are structural exceptions; design choices
 * must otherwise resolve through `var(--sk-*)`.
 */

import { readFileSync } from 'node:fs';
import postcss from 'postcss';
import valueParser from 'postcss-value-parser';

const CSS_WIDE = /^(?:inherit|initial|revert|revert-layer|unset)$/i;
const SYSTEM_COLOUR = /^(?:Canvas|CanvasText|LinkText|VisitedText|ActiveText|ButtonFace|ButtonText|Field|FieldText|Highlight|HighlightText|GrayText|Mark|MarkText|AccentColor|AccentColorText|currentColor|transparent)$/i;
const STRUCTURAL = /^(?:0|none|normal|auto|solid|dashed|dotted|double|hidden|thin|medium|thick|subgrid|min-content|max-content|fit-content|content-box|border-box|tabular-nums)$/i;
const GRID_TRACK_PROPERTY = /^grid-auto-(?:columns|rows)$/i;

const propertyClass = (property) => {
  const prop = property.toLowerCase();
  if (
    /(?:^|-)color$/.test(prop) ||
    ['color', 'fill', 'stroke', 'background', 'background-image'].includes(prop)
  ) return 'color';
  if (
    /^(?:margin|padding|gap|row-gap|column-gap|inset|top|right|bottom|left|width|height|min-width|max-width|min-height|max-height|inline-size|block-size|min-inline-size|max-inline-size|min-block-size|max-block-size|grid-auto-columns|grid-auto-rows)(?:-|$)/.test(prop)
  ) return 'spacing/gap';
  if (/^(?:font(?:-|$)|line-height$|letter-spacing$|word-spacing$)/.test(prop)) return 'typography/line';
  if (/^(?:border-(?:start-|end-|top-|right-|bottom-|left-|block-|inline-)?(?:start-|end-)?radius|border-radius)$/.test(prop)) return 'radius';
  if (/^(?:border|outline)(?:-|$)/.test(prop)) return 'border/outline';
  if (/^(?:box-shadow|text-shadow|filter)$/.test(prop)) return 'shadow';
  if (/^(?:transition|animation)(?:-|$)/.test(prop)) return 'motion';
  if (prop === 'z-index') return 'z-index';
  return null;
};

const withoutFunctions = (value) => value
  .replace(/var\(\s*--sk-[^)]+\)/gi, '')
  .replace(/\b(?:calc|min|max|minmax|clamp|drop-shadow)\s*\(/gi, ' ')
  .replace(/[(),+*/-]/g, ' ')
  .trim();

const hasNonemptyVarFallback = (value) => {
  let found = false;
  valueParser(value).walk((node) => {
    if (node.type !== 'function' || node.value.toLowerCase() !== 'var') return undefined;
    const comma = node.nodes.findIndex((child) => child.type === 'div' && child.value === ',');
    if (comma >= 0 && node.nodes.length > comma + 1) {
      found = true;
      return false;
    }
    return undefined;
  });
  return found;
};

const isStructuralRemainder = (value, property) =>
  value === '' ||
  value
    .split(/\s+/)
    .every(
      (token) =>
        STRUCTURAL.test(token) ||
        /^-?(?:\d+(?:\.\d+)?|\.\d+)%$/.test(token) ||
        (GRID_TRACK_PROPERTY.test(property) && /^1fr$/i.test(token)),
    );

const isInActiveForcedColours = (declaration) => {
  let node = declaration.parent;
  while (node) {
    if (
      node.type === 'atrule' &&
      node.name.toLowerCase() === 'media' &&
      /\(\s*forced-colors\s*:\s*active\s*\)/i.test(node.params)
    ) return true;
    node = node.parent;
  }
  return false;
};

const isAllowed = (value, declaration) => {
  const importantFree = value.replace(/\s*!important\s*$/i, '').trim();
  if (hasNonemptyVarFallback(importantFree)) return false;
  if (CSS_WIDE.test(importantFree) || isStructuralRemainder(importantFree, declaration.prop)) return true;
  if (SYSTEM_COLOUR.test(importantFree)) {
    return /^(?:currentColor|transparent)$/i.test(importantFree) || isInActiveForcedColours(declaration);
  }
  if (importantFree.includes('var(--sk-')) {
    const remainder = withoutFunctions(importantFree);
    if (isStructuralRemainder(remainder, declaration.prop)) return true;
  }
  return false;
};

const inspectCss = (css, from = '<input>') => {
  const root = postcss.parse(css, { from });
  const errors = [];
  root.walkDecls((declaration) => {
    const category = propertyClass(declaration.prop);
    if (category && !isAllowed(declaration.value, declaration)) {
      errors.push({
        category,
        property: declaration.prop,
        value: declaration.value,
        line: declaration.source?.start?.line ?? 0,
      });
    }
  });
  return errors;
};

const selftest = () => {
  const probes = [
    ['color', 'color: #fff'],
    ['color', 'background: linear-gradient(#fff, #000)'],
    ['spacing/gap', 'gap: 12px'],
    ['spacing/gap', 'width: calc(var(--sk-space-2) + 1px)'],
    ['spacing/gap', 'inline-size: 222px'],
    ['spacing/gap', 'block-size: 222px'],
    ['spacing/gap', 'min-inline-size: 222px'],
    ['spacing/gap', 'max-inline-size: 80rem'],
    ['spacing/gap', 'min-block-size: 222px'],
    ['spacing/gap', 'max-block-size: 80rem'],
    ['spacing/gap', 'grid-auto-columns: minmax(222px, 1fr)'],
    ['spacing/gap', 'grid-auto-rows: minmax(222px, 1fr)'],
    ['spacing/gap', 'grid-auto-columns: 2fr'],
    ['spacing/gap', 'grid-auto-rows: 222fr'],
    ['spacing/gap', 'width: var(--sk-layout-content-max, 220px)'],
    ['color', 'color: var(--sk-fg-default, #fff)'],
    ['typography/line', 'font-size: 16px'],
    ['typography/line', 'word-spacing: 0.1em'],
    ['radius', 'border-radius: 8px'],
    ['border/outline', 'outline: 2px solid red'],
    ['shadow', 'box-shadow: 0 1px 3px #000'],
    ['shadow', 'filter: drop-shadow(0 1px 3px #000)'],
    ['motion', 'transition-duration: 180ms'],
    ['z-index', 'z-index: 10'],
    ['color', 'color: CanvasText'],
  ];
  let failures = 0;
  for (const [category, declaration] of probes) {
    const errors = inspectCss(`.probe { ${declaration}; }`, `<${category}>`);
    if (errors.length !== 1 || errors[0].category !== category) {
      console.error(`  ✗ ${category} probe did not fail exactly once: ${JSON.stringify(errors)}`);
      failures++;
    }
  }
  const clean = inspectCss(`
    .probe {
      color: var(--sk-fg-default);
      gap: var(--sk-space-2);
      width: 100%;
      inline-size: var(--sk-layout-content-max);
      min-block-size: var(--sk-size-control-md);
      grid-auto-columns: minmax(var(--sk-layout-content-max), 1fr);
      grid-auto-rows: 1fr;
      font-size: var(--sk-text-sm);
      word-spacing: var(--sk-space-1);
      border-radius: var(--sk-radius-sm);
      border: 0;
      box-shadow: none;
      filter: drop-shadow(0 0 var(--sk-space-1) var(--sk-border-strong));
      transition: none;
      z-index: var(--sk-z-overlay);
    }
    @media (forced-colors: active) { .probe { color: CanvasText; } }
  `, '<clean>');
  if (clean.length !== 0) {
    console.error(`  ✗ token/system-colour exceptions failed: ${JSON.stringify(clean)}`);
    failures++;
  }
  const forcedColourOutside = inspectCss('.probe { color: CanvasText; }', '<system-outside>');
  const forcedColourInside = inspectCss(
    '@media (forced-colors: active) { .probe { color: CanvasText; } }',
    '<system-inside>',
  );
  if (forcedColourOutside.length !== 1 || forcedColourInside.length !== 0) {
    console.error(
      `  ✗ system colours must fail outside and pass inside active forced colours: ` +
      `${JSON.stringify({ forcedColourOutside, forcedColourInside })}`,
    );
    failures++;
  }
  if (failures > 0) process.exit(1);
  console.log(`✅ all ${probes.length} governed token classes fail red; structural exceptions pass.`);
};

if (process.argv.includes('--selftest')) {
  selftest();
} else {
  const files = process.argv.slice(2);
  if (files.length === 0) {
    console.error('❌ pass one or more explicit CSS file paths');
    process.exit(1);
  }
  let errors = [];
  for (const file of files) {
    try {
      errors = errors.concat(inspectCss(readFileSync(file, 'utf8'), file).map((error) => ({ ...error, file })));
    } catch (error) {
      console.error(`❌ could not parse ${file}: ${error instanceof Error ? error.message : String(error)}`);
      process.exit(1);
    }
  }
  if (errors.length > 0) {
    console.error('❌ raw design-bearing CSS values found:');
    for (const error of errors) {
      console.error(`   ${error.file}:${error.line} [${error.category}] ${error.property}: ${error.value}`);
    }
    process.exit(1);
  }
  console.log(`✅ ${files.length} explicit component stylesheet(s) use tokens for all governed values.`);
}
