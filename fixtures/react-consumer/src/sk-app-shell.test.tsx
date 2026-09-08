import * as React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, expect, test } from 'vitest';
import {
  SkAppShell,
  type SkAppShellElement,
  type SkAppShellProps,
} from '@spec-kitty/react';

type SkAppShellDismissDetail = Parameters<NonNullable<SkAppShellProps['onSkAppShellDismiss']>>[0]['detail'];

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let host: HTMLDivElement;
let root: Root;

beforeEach(() => {
  host = document.createElement('div');
  document.body.append(host);
  root = createRoot(host);
});

afterEach(() => {
  act(() => root.unmount());
  host.remove();
});

const render = (ui: React.ReactNode) => act(() => root.render(ui));

const settleAppShell = async (element: SkAppShellElement): Promise<void> => {
  await customElements.whenDefined('sk-app-shell');
  await element.updateComplete;
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  await element.updateComplete;
};

test('[SC-010] the generated wrapper delivers reflected state and the property-only trigger', async () => {
  const trigger = document.createElement('button');
  render(<SkAppShell presentation="compact" open compactTrigger={trigger} />);
  const element = host.querySelector('sk-app-shell') as SkAppShellElement;
  expect(element.getAttribute('presentation')).toBe('compact');
  expect(element.hasAttribute('open')).toBe(true);
  expect(element.compactTrigger).toBe(trigger);
  expect(element.hasAttribute('compact-trigger')).toBe(false);

  render(<SkAppShell presentation="compact" open={false} compactTrigger={trigger} />);
  await element.updateComplete;
  expect(element.hasAttribute('open')).toBe(false);
  expect(element.compactTrigger).toBe(trigger);

  render(<SkAppShell presentation="compact" open={false} />);
  await element.updateComplete;
  expect(element.compactTrigger).toBe(null);
});

test('[SC-012] a stateful React consumer accepts Escape after its scheduled close commits', async () => {
  const trace: string[] = [];

  function Consumer({ acceptDismissal }: Readonly<{ acceptDismissal: boolean }>) {
    const [open, setOpen] = React.useState(true);
    const [trigger, setTrigger] = React.useState<HTMLButtonElement | null>(null);
    const shell = React.useRef<SkAppShellElement>(null);

    return (
      <SkAppShell
        ref={shell}
        presentation="compact"
        open={open}
        compactTrigger={trigger}
        onSkAppShellDismiss={() => {
          const drawer = shell.current?.shadowRoot?.querySelector<HTMLElement>(
            '[part="compact-navigation"]',
          );
          trace.push(drawer?.hidden ? 'handler-closed' : 'handler-open');
          if (acceptDismissal) setOpen(false);
        }}
      >
        <button
          ref={setTrigger}
          slot="compact-header"
          aria-controls="react-compact-navigation"
          aria-expanded={open}
        >
          Menu
        </button>
        <nav
          id="react-compact-navigation"
          slot="compact-navigation"
          aria-label="Repository navigation"
        >
          <a href="#missions">Missions</a>
        </nav>
        <button type="button" onClick={() => setOpen(false)}>Route close</button>
      </SkAppShell>
    );
  }

  host.style.width = '390px';
  render(<Consumer acceptDismissal />);
  let element = host.querySelector('sk-app-shell') as SkAppShellElement;
  await settleAppShell(element);
  let drawer = element.shadowRoot!.querySelector<HTMLElement>('[part="compact-navigation"]')!;
  let trigger = element.querySelector<HTMLButtonElement>('[slot="compact-header"]')!;
  let link = element.querySelector<HTMLAnchorElement>('[slot="compact-navigation"] a')!;
  trigger.addEventListener('focus', () => {
    trace.push(drawer.hidden ? 'focus-after-close' : 'focus-before-close');
  });

  act(() => {
    link.focus();
    link.dispatchEvent(new KeyboardEvent('keydown', {
      key: 'Escape', bubbles: true, composed: true,
    }));
    expect(drawer.hidden, 'the drawer closed before dispatch returned').toBe(false);
    expect(document.activeElement, 'focus returned before the close render').toBe(link);
  });
  await element.updateComplete;
  await Promise.resolve();

  expect(element.open, 'React represents the false custom-element prop by omission').toBeUndefined();
  expect(drawer.hidden).toBe(true);
  expect(document.activeElement).toBe(trigger);
  expect(trace).toEqual(['handler-open', 'focus-after-close']);

  render(<Consumer key="reject" acceptDismissal={false} />);
  element = host.querySelector('sk-app-shell') as SkAppShellElement;
  await settleAppShell(element);
  drawer = element.shadowRoot!.querySelector<HTMLElement>('[part="compact-navigation"]')!;
  trigger = element.querySelector<HTMLButtonElement>('[slot="compact-header"]')!;
  link = element.querySelector<HTMLAnchorElement>('[slot="compact-navigation"] a')!;

  act(() => {
    link.focus();
    link.dispatchEvent(new KeyboardEvent('keydown', {
      key: 'Escape', bubbles: true, composed: true,
    }));
  });
  expect(element.open).toBe(true);
  expect(drawer.hidden).toBe(false);

  await new Promise<void>((resolve) => setTimeout(resolve, 0));
  expect(element.open).toBe(true);
  expect(drawer.hidden).toBe(false);
  expect(document.activeElement).toBe(link);
  const routeClose = element.querySelector<HTMLButtonElement>('button:not([slot])')!;
  await act(async () => routeClose.click());
  await element.updateComplete;
  expect(element.open).toBeUndefined();
  expect(drawer.hidden).toBe(true);
  expect(document.activeElement).not.toBe(link);
  expect(document.activeElement).not.toBe(trigger);
});

test('[SC-006] the generated wrapper delivers one typed dismissal event', async () => {
  const received: SkAppShellDismissDetail[] = [];
  render(<SkAppShell onSkAppShellDismiss={(event) => received.push(event.detail)} />);
  const element = host.querySelector('sk-app-shell') as SkAppShellElement;
  const detail = Object.freeze({ reason: 'escape' as const });
  await act(async () => {
    element.dispatchEvent(new CustomEvent<SkAppShellDismissDetail>('sk-app-shell-dismiss', {
      detail,
      bubbles: true,
      composed: true,
      cancelable: false,
    }));
  });
  expect(received).toEqual([detail]);
});
