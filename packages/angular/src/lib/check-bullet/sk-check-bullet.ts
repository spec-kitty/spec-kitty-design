import { Component, Input } from '@angular/core';

@Component({
  selector: 'sk-check-bullet',
  standalone: true,
  imports: [],
  templateUrl: './sk-check-bullet.html',
  styleUrl: './sk-check-bullet.css',
  // Angular renders the template INSIDE this host element, so a bare <li> in the
  // template is a list item whose parent is <sk-check-bullet> rather than the
  // <ul> the consumer wrote. axe reported both halves of that — `listitem` (an
  // <li> with no list parent) and `list` (a <ul> with non-<li> children).
  //
  // The host carries the role instead, which is what the consumer's <ul> actually
  // sees, and the template root is a plain <div>. This is also the shape that
  // survives ADR-8: a custom element with a shadow root has exactly the same
  // problem, and exactly the same fix.
  host: { role: 'listitem' },
})
export class SkCheckBulletComponent {
  @Input() text: string = '';
}
