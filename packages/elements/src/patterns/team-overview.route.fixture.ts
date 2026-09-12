import { html, nothing, type TemplateResult } from "lit";
import {
  safeTeamOverviewHref,
  type DeepReadonly,
  type SuppliedRoute,
} from "./team-overview.fixture.js";

/**
 * Story-only route rendering seam. Invalid supplied destinations retain their label as passive
 * text; this module is intentionally absent from the package barrel and runtime component API.
 */
export const renderTeamOverviewRoute = (
  route: DeepReadonly<SuppliedRoute> | undefined,
  className: string,
  current = false,
): TemplateResult | typeof nothing => {
  if (!route) return nothing;
  const href = safeTeamOverviewHref(route);
  return href
    ? html`<a
        class=${className}
        href=${href}
        aria-current=${current ? "page" : nothing}
        >${route.label}</a
      >`
    : html`<span data-passive-route=${route.kind}>${route.label}</span>`;
};
