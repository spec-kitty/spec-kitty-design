// The cascade probe's competing CONSUMER rule, injected identically on both sides.
//
// THREE SPECIFICITY REGIMES, because cycle-1 conflated two of them. The library's static
// rewrite `.sk-entity-marker__content > img` is (0,1,1):
//
//   competing=weak   -> `img { … }`                    (0,0,1) — LOSES to the library rule
//   competing=tie    -> `.page-scope img { … }`        (0,1,1) — TIES it (cycle-1 called this
//                                                       "higher specificity"; it is not)
//   competing=strong -> `.page-scope.theme img { … }`  (0,2,1) — genuinely OUTBIDS it
//
// AND TWO DOCUMENT POSITIONS, because at a tie the winner is decided by order, not weight:
//
//   order=last  (default) -> appended to <head>, after the library's <link> and the variant
//                            sheet. The realistic case: a consumer loads the library, then
//                            their own stylesheet.
//   order=first           -> inserted at the very start of <head>, before the library's
//                            <link>. Also realistic — a consumer whose bundler hoists vendor
//                            CSS after their own, or who links the library last.
//
// Order is irrelevant on the SHADOW side by construction: an outer-tree declaration beats a
// ::slotted() declaration from the inner tree regardless of specificity OR order. Varying it
// therefore isolates exactly the property the static rewrite fails to reproduce.
(() => {
  const params = new URLSearchParams(location.search);
  const competing = params.get('competing') ?? 'none';
  if (competing === 'none') return;
  const SELECTORS = {
    weak: 'img',
    tie: '.page-scope img',
    strong: '.page-scope.theme img',
  };
  const selector = SELECTORS[competing];
  if (!selector) throw new Error(`unknown competing regime ${competing}`);
  const style = document.createElement('style');
  style.id = 'consumer-rule';
  style.textContent = `${selector} { object-fit: contain; }`;
  if ((params.get('order') ?? 'last') === 'first') document.head.prepend(style);
  else document.head.append(style);
})();
