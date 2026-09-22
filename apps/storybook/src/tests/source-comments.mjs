/**
 * Remove every delimited comment, including comment markers exposed when two
 * surrounding fragments are joined. This is intentionally a scanner rather
 * than a one-pass multi-character replacement: a single replacement can turn
 * hostile input into a fresh comment boundary.
 *
 * @param {string} source
 * @param {string} opener
 * @param {string} closer
 */
function removeDelimitedComments(source, opener, closer) {
  let cursor = 0;
  let result = '';

  while (cursor < source.length) {
    const start = source.indexOf(opener, cursor);
    if (start === -1) return result + source.slice(cursor);

    result += source.slice(cursor, start);
    const end = source.indexOf(closer, start + opener.length);
    if (end === -1) return result;
    cursor = end + closer.length;
  }

  return result;
}

/** @param {string} source */
export function stripCssAndHtmlComments(source) {
  let current = source;

  for (;;) {
    const next = removeDelimitedComments(
      removeDelimitedComments(current, '/*', '*/'),
      '<!--',
      '-->',
    );
    if (next === current) return next;
    current = next;
  }
}
