<!--
  THE NEGATIVE CONTROL. `chartreuse` is not a declared sk-pill-tag variant.

  `vue-tsc` must report an error here. The fixture's typecheck target asserts that it does — a
  green run over this file means the generated types have stopped reaching templates, which is
  exactly the regression that shipped once already.
-->
<template>
  <sk-pill-tag variant="chartreuse">Nope</sk-pill-tag>
</template>
