/**
 * CONNECTORS PATTERN FIXTURE — unblocked scope (C1-C4 only), mission #338.
 *
 * One internally consistent, deep-frozen fixture family (FR-017) supplying every repeated
 * provider, health, count, ID, timestamp, and permission value composed by the C1-C4 canvases.
 * Pure projection functions below derive what each canvas shows or omits; no discovery, polling,
 * inference, arithmetic, routing, or timers (C-005, C-007).
 *
 * SIX CANVASES ARE DELIBERATELY ABSENT FROM THIS PASS: C5 (blocked on #336, #321), C6/C7/C8/C9a
 * (blocked on #337, and #320/#321 for two specific controls within them), and C9b (conditionally
 * blocked on #321). See kitty-specs/connectors-pattern-stories-01M26947/research.md's "Dependency
 * reconciliation" section and tasks.md's T008-T011. Nothing here composes a missing public
 * surface; the field shapes below are grounded in the product corpus's own fixture JSON
 * (`ux_redesign/families/03-connectors/screens/C{1,2,3,4}-*.html`'s embedded `<script
 * type="application/json">` blocks), read as product evidence, never copied as markup or CSS.
 *
 * TRUTH BOUNDARIES THIS FIXTURE MUST NOT VIOLATE (FR-011, FR-012, FR-014, FR-018, FR-019):
 *   - GitHub admission is automatic — no `admittedRepositories` field is ever paired with a
 *     "selected" flag, and no projection renders a repository checkbox or "Admit selected" action.
 *   - Slack is outbound-only — `SlackConnection` carries no inbound/preview/delivery-test field.
 *   - `/discovery/` never appears as a link target anywhere in this fixture or its projections.
 *   - Every form-shaped action below is `{ method, action }` evidence only; nothing here executes
 *     a request, and the story layer intercepts `submit` with `preventDefault()` (see stories.ts).
 */

// ---------------------------------------------------------------------------------------------
// Shared vocabulary — reused, not reinvented, from the library's own public enums.
// ---------------------------------------------------------------------------------------------

/** The library's one status tone vocabulary (`sk-status-indicator`, `sk-card`, `sk-pill-tag`, `sk-notice`). */
export type ConnectorTone = 'neutral' | 'info' | 'success' | 'attention' | 'danger' | 'recovery';

export type ConnectorHealth = 'active' | 'degraded' | 'needs_reauth' | 'revoked' | 'not_installed';

/** Maps supplied backend health to the library's tone vocabulary. A pure, total function — every
 * health value the fixture can carry maps to exactly one tone; nothing is left to infer. */
export function healthTone(health: ConnectorHealth): ConnectorTone {
  switch (health) {
    case 'active':
      return 'success';
    case 'degraded':
      return 'attention';
    case 'needs_reauth':
    case 'revoked':
      return 'danger';
    case 'not_installed':
      return 'neutral';
  }
}

/** A role gate purely mirrors what a backend already decided; it never recomputes permission. */
export type ConnectorRole = 'admin' | 'member';

// ---------------------------------------------------------------------------------------------
// C1 — setup index
// ---------------------------------------------------------------------------------------------

export type SetupGap = Readonly<{ id: string; text: string }>;

export type SetupFixture = Readonly<{
  team: Readonly<{ name: string; slug: string }>;
  canManageConnectors: boolean;
  hasAnyInstallation: false;
  githubAppReady: boolean;
  slackAppReady: boolean;
  nangoConfigured: boolean;
  gaps: ReadonlyArray<SetupGap>;
}>;

export type SetupProjection = Readonly<{
  team: Readonly<{ name: string; slug: string }>;
  gaps: ReadonlyArray<SetupGap>;
  /** True only when the fixture supplies zero gaps AND zero installations — used to prove no
   * fabricated "all clear" state is ever shown where a real gap exists. */
  noGapsToReport: boolean;
}>;

/** Pure: renders nothing the fixture does not already state. */
export function selectSetupProjection(fixture: SetupFixture): SetupProjection {
  return {
    team: fixture.team,
    gaps: fixture.gaps,
    noGapsToReport: fixture.gaps.length === 0,
  };
}

// ---------------------------------------------------------------------------------------------
// C2 — operating index
// ---------------------------------------------------------------------------------------------

export type GithubInstallation = Readonly<{
  uuid: string;
  externalAccountLabel: string;
  health: ConnectorHealth;
  isEnabled: boolean;
  /** Automatic-admission repository list. No selection state exists anywhere on this type —
   * GitHub coverage is automatic (FR-011); there is no `selected`/`admitted` boolean per repo. */
  admittedRepositories: ReadonlyArray<string>;
  mappingCount: number;
  /** Off-site management URL, supplied by the backend — never constructed client-side. */
  manageUrl: string;
}>;

export type GitlabInstallation = Readonly<{
  uuid: string;
  externalAccountLabel: string;
  health: ConnectorHealth;
  isEnabled: boolean;
  mappingCount: number;
}>;

export type RelayStatus = Readonly<{
  deploymentId: string;
  state: 'active' | 'suspended' | 'error';
  providerLabel: string;
  lastActiveAt: string;
  lastError: string;
}>;

/** Slack is outbound-only by construction — no field on this type can represent an inbound
 * preview, a readback, or a delivery test (FR-012). */
export type SlackConnection = Readonly<{
  workspaceName: string;
  channelName: string;
  isReady: boolean;
  lastErrorCode: string;
}>;

export type OperatingFixture = Readonly<{
  team: Readonly<{ name: string; slug: string }>;
  hasAnyInstallation: true;
  github: GithubInstallation | null;
  gitlab: GitlabInstallation | null;
  relay: RelayStatus | null;
  slack: SlackConnection | null;
}>;

export type ProviderCardProjection = Readonly<{
  id: 'github' | 'gitlab';
  label: string;
  tone: ConnectorTone;
  healthText: string;
  facts: ReadonlyArray<Readonly<{ term: string; value: string }>>;
  /** Present only for admins, and only for GitHub, and is never a picker — it links off-site to
   * the provider's own installation management UI. There is no `admit selected` action. */
  manageAction: Readonly<{ label: string; href: string; disabledForRole: boolean }> | null;
}>;

export type OperatingProjection = Readonly<{
  team: Readonly<{ name: string; slug: string }>;
  role: ConnectorRole;
  providerCards: ReadonlyArray<ProviderCardProjection>;
  relayNotice: Readonly<{ tone: ConnectorTone; heading: string; message: string }> | null;
  slackNotice: Readonly<{ tone: ConnectorTone; message: string }> | null;
  /** Trailing per-row control for the one linked GitHub account summary row, proving the
   * already-public `sk-action-row` `controls` slot composes C2 without #307 (research.md finding,
   * 2026-09-10). Absent entirely for a member — permission removes the control, not the row. */
  linkedAccountRow: Readonly<{ id: string; label: string; reference: string; canDisconnect: boolean }> | null;
}>;

function providerFacts(
  install: GithubInstallation | GitlabInstallation,
): ReadonlyArray<Readonly<{ term: string; value: string }>> {
  const facts: Array<Readonly<{ term: string; value: string }>> = [
    { term: 'Account', value: install.externalAccountLabel },
    { term: 'Mappings', value: String(install.mappingCount) },
  ];
  if ('admittedRepositories' in install) {
    facts.push({ term: 'Repositories', value: String(install.admittedRepositories.length) });
  }
  return facts;
}

/** Pure. Role only removes controls — every fact present for an admin is present for a member
 * too (FR-020); the difference is exclusively `manageAction`/`canDisconnect`. */
export function selectOperatingProjection(fixture: OperatingFixture, role: ConnectorRole): OperatingProjection {
  const cards: ProviderCardProjection[] = [];
  if (fixture.github) {
    cards.push({
      id: 'github',
      label: 'GitHub',
      tone: healthTone(fixture.github.health),
      healthText: fixture.github.isEnabled ? 'Installed' : 'Not installed',
      facts: providerFacts(fixture.github),
      manageAction: { label: 'Manage on GitHub', href: fixture.github.manageUrl, disabledForRole: role !== 'admin' },
    });
  }
  if (fixture.gitlab) {
    cards.push({
      id: 'gitlab',
      label: 'GitLab',
      tone: healthTone(fixture.gitlab.health),
      healthText: fixture.gitlab.isEnabled ? 'Installed' : 'Not installed',
      facts: providerFacts(fixture.gitlab),
      manageAction: null,
    });
  }

  const relayNotice =
    fixture.relay && role === 'admin'
      ? {
          tone: (fixture.relay.state === 'error' ? 'danger' : 'info') as ConnectorTone,
          heading: 'Relay status',
          message:
            fixture.relay.state === 'error'
              ? `${fixture.relay.providerLabel} relay reported: ${fixture.relay.lastError}`
              : `${fixture.relay.providerLabel} relay is ${fixture.relay.state}, last active ${fixture.relay.lastActiveAt}.`,
        }
      : null;

  const slackNotice = fixture.slack
    ? {
        tone: (fixture.slack.isReady ? 'success' : 'attention') as ConnectorTone,
        message: fixture.slack.isReady
          ? `Posting to #${fixture.slack.channelName} in ${fixture.slack.workspaceName}. Outbound only.`
          : `Slack posting is not ready (${fixture.slack.lastErrorCode}). Outbound only — no inbound preview.`,
      }
    : null;

  const linkedAccountRow =
    fixture.github && role === 'admin'
      ? {
          id: fixture.github.uuid,
          label: fixture.github.externalAccountLabel,
          reference: fixture.github.uuid,
          canDisconnect: true,
        }
      : null;

  return {
    team: fixture.team,
    role,
    providerCards: cards,
    relayNotice,
    slackNotice,
    linkedAccountRow,
  };
}

// ---------------------------------------------------------------------------------------------
// C3 — provider authorization handoff
// ---------------------------------------------------------------------------------------------

export type HandoffFlow = 'installation' | 'reconnect' | 'user-link';
export type HandoffPhase = 'waiting' | 'completing' | 'failed';

export type HandoffVariant = Readonly<{
  flow: HandoffFlow;
  phase: HandoffPhase;
  team: Readonly<{ name: string; slug: string }>;
  provider: string;
  /** Evidence only — never invoked. The story layer intercepts submission (FR-018). */
  entry: Readonly<{ method: 'GET' | 'POST'; path: string }>;
  back: string;
  /** Present only on `phase: 'failed'`. Source-exact — the fixture supplies the literal text. */
  failure: string | null;
}>;

export type HandoffFixture = Readonly<{
  team: Readonly<{ name: string; slug: string }>;
  provider: string;
  variants: ReadonlyArray<HandoffVariant>;
}>;

export type HandoffProjection = Readonly<{
  team: Readonly<{ name: string; slug: string }>;
  provider: string;
  flow: HandoffFlow;
  phase: HandoffPhase;
  heading: string;
  entry: Readonly<{ method: 'GET' | 'POST'; path: string }>;
  back: string;
  failure: string | null;
}>;

const HANDOFF_HEADING: Record<HandoffFlow, string> = {
  installation: 'Connecting a new installation',
  reconnect: 'Reconnecting this installation',
  'user-link': 'Linking your account',
};

/** Pure. Looks up one variant by flow; never fabricates a phase the fixture does not carry. */
export function selectHandoffProjection(fixture: HandoffFixture, flow: HandoffFlow): HandoffProjection {
  const variant = fixture.variants.find((entry) => entry.flow === flow);
  if (!variant) {
    throw new Error(`no handoff variant fixtured for flow "${flow}"`);
  }
  return {
    team: fixture.team,
    provider: fixture.provider,
    flow: variant.flow,
    phase: variant.phase,
    heading: HANDOFF_HEADING[variant.flow],
    entry: variant.entry,
    back: variant.back,
    failure: variant.failure,
  };
}

// ---------------------------------------------------------------------------------------------
// C4 — GitHub App setup failure
// ---------------------------------------------------------------------------------------------

export type GithubAppFailureVariant = Readonly<{
  id: 'resolved-team' | 'no-team-boundary';
  team: Readonly<{ name: string; slug: string }> | null;
  error: string;
  /** `null` on the no-Team boundary variant — the back route is genuinely absent, not disabled
   * (FR-004). A `null` here must never render as a disabled link; it must render as no link. */
  backHref: string | null;
}>;

export type GithubAppFailureFixture = Readonly<{
  heading: string;
  subtitle: string;
  variants: ReadonlyArray<GithubAppFailureVariant>;
}>;

export type GithubAppFailureProjection = Readonly<{
  heading: string;
  subtitle: string;
  team: Readonly<{ name: string; slug: string }> | null;
  error: string;
  backHref: string | null;
}>;

/** Pure. */
export function selectGithubAppFailureProjection(
  fixture: GithubAppFailureFixture,
  id: GithubAppFailureVariant['id'],
): GithubAppFailureProjection {
  const variant = fixture.variants.find((entry) => entry.id === id);
  if (!variant) {
    throw new Error(`no GitHub App failure variant fixtured for id "${id}"`);
  }
  return {
    heading: fixture.heading,
    subtitle: fixture.subtitle,
    team: variant.team,
    error: variant.error,
    backHref: variant.backHref,
  };
}

// ---------------------------------------------------------------------------------------------
// C5 — GitLab exactly-one group selection (unblocked 2026-09-11: #336 merged to train as
// `0a232a01`). Composes the now-public `.sk-radio-choice-group` class family
// (`packages/styles/src/radio-choice-group/`) from its documented markup contract only — no CSS
// or internals read from that family beyond its own shipped `.html` exemplars, which this fixture
// paraphrases the SHAPE of, not the copy. FR-013: only this canvas exposes another-group
// connection and exactly-one selection; no other canvas in this mission renders a radio group.
// ---------------------------------------------------------------------------------------------

export type GitlabGroup = Readonly<{ id: string; name: string; display: string }>;

export type GitlabGroupSelectionState = 'populated' | 'no-groups' | 'validation' | 'connected-refresh-failed';

export type GitlabGroupFixture = Readonly<{
  team: Readonly<{ name: string; slug: string }>;
  installationUuid: string;
  groups: ReadonlyArray<GitlabGroup>;
  /** The already-connected group, present only for the connected-refresh-failed state. Backend
   * supplied; never inferred from `groups` (which may not even include it after a refresh). */
  connectedGroup: GitlabGroup | null;
  selectionMethod: 'POST';
  selectionPath: string;
  refreshMethod: 'POST';
  refreshPath: string;
  failures: Readonly<{ missing: string; manualRefresh: string; list: string }>;
}>;

export type GitlabGroupProjection = Readonly<{
  team: Readonly<{ name: string; slug: string }>;
  state: GitlabGroupSelectionState;
  groups: ReadonlyArray<GitlabGroup>;
  connectedGroup: GitlabGroup | null;
  selectionMethod: 'POST';
  selectionPath: string;
  refreshMethod: 'POST';
  refreshPath: string;
  /** Non-null only for `validation` (the missing-selection message) and `connected-refresh-failed`
   * (the manual-refresh failure) — `populated` and `no-groups` show no error. */
  failureMessage: string | null;
}>;

/** Pure. Never renders a success message for any state — FR-005/FR-013's "no submission-success
 * theater" boundary — because no state this function can select carries one. */
export function selectGitlabGroupProjection(
  fixture: GitlabGroupFixture,
  state: GitlabGroupSelectionState,
): GitlabGroupProjection {
  const shared = {
    team: fixture.team,
    selectionMethod: fixture.selectionMethod,
    selectionPath: fixture.selectionPath,
    refreshMethod: fixture.refreshMethod,
    refreshPath: fixture.refreshPath,
  };
  switch (state) {
    case 'populated':
      return { ...shared, state, groups: fixture.groups, connectedGroup: null, failureMessage: null };
    case 'no-groups':
      return { ...shared, state, groups: [], connectedGroup: null, failureMessage: null };
    case 'validation':
      return { ...shared, state, groups: fixture.groups, connectedGroup: null, failureMessage: fixture.failures.missing };
    case 'connected-refresh-failed':
      return {
        ...shared,
        state,
        groups: [],
        connectedGroup: fixture.connectedGroup,
        failureMessage: fixture.failures.manualRefresh,
      };
  }
}

// ---------------------------------------------------------------------------------------------
// C9b — Slack public-channel selection (unblocked 2026-09-11: #321's input contrast/target-size
// contract landed as PR #339 — moot for this canvas specifically, since the picker is a native
// `<select>` via `.sk-form-select`, never `.sk-input`; the corpus's own
// `excluded_actions_and_capabilities` list confirms no search/filter text input exists). FR-012:
// outbound-only — no preview, readback, delivery-test, or private-channel capability anywhere.
// ---------------------------------------------------------------------------------------------

export type SlackChannel = Readonly<{ id: string; name: string }>;

export type SlackChannelPickerState = 'populated' | 'empty' | 'refused' | 'rate-limited' | 'incomplete';

export type SlackChannelPickerFixture = Readonly<{
  team: Readonly<{ name: string; slug: string }>;
  workspaceName: string;
  choosePath: string;
  laterPath: string;
  projections: Readonly<
    Record<
      SlackChannelPickerState,
      Readonly<{
        channels: ReadonlyArray<SlackChannel>;
        selectedChannelId: string;
        channelsComplete: boolean;
        errorMessage: string | null;
      }>
    >
  >;
}>;

export type SlackChannelPickerProjection = Readonly<{
  team: Readonly<{ name: string; slug: string }>;
  workspaceName: string;
  state: SlackChannelPickerState;
  choosePath: string;
  laterPath: string;
  channels: ReadonlyArray<SlackChannel>;
  /** `"<id>|<name>"`, matching the corpus's own `option_contract.submitted_value` — evidence
   * only, never submitted by this module. */
  options: ReadonlyArray<Readonly<{ value: string; label: string; selected: boolean }>>;
  channelsComplete: boolean;
  errorMessage: string | null;
}>;

/** Pure. */
export function selectSlackChannelPickerProjection(
  fixture: SlackChannelPickerFixture,
  state: SlackChannelPickerState,
): SlackChannelPickerProjection {
  // eslint-disable-next-line security/detect-object-injection -- key is the literal union type SlackChannelPickerState
  const projection = fixture.projections[state];
  return {
    team: fixture.team,
    workspaceName: fixture.workspaceName,
    state,
    choosePath: fixture.choosePath,
    laterPath: fixture.laterPath,
    channels: projection.channels,
    options: projection.channels.map((channel) => ({
      value: `${channel.id}|${channel.name}`,
      label: channel.name,
      selected: channel.id === projection.selectedChannelId,
    })),
    channelsComplete: projection.channelsComplete,
    errorMessage: projection.errorMessage,
  };
}

// ---------------------------------------------------------------------------------------------
// The one fixture family (FR-017) — deep-frozen so no consumer of it can mutate shared state.
// ---------------------------------------------------------------------------------------------

export type ConnectorsFixture = Readonly<{
  setup: SetupFixture;
  operating: OperatingFixture;
  handoff: HandoffFixture;
  githubAppFailure: GithubAppFailureFixture;
  gitlabGroup: GitlabGroupFixture;
  slackChannelPicker: SlackChannelPickerFixture;
}>;

/** Recursively freezes an object graph. Mirrors the freeze helper convention established by
 * `repository-dossier.fixture.ts` and `mission-kanban.stories.ts` — plain objects/arrays only,
 * no class instances, no functions as values. */
export function deepFreeze<T>(value: T): DeepReadonly<T> {
  if (value !== null && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.values(value as Record<string, unknown>).forEach((child) => deepFreeze(child));
    Object.freeze(value);
  }
  return value as DeepReadonly<T>;
}

export type DeepReadonly<T> = T extends (infer U)[]
  ? ReadonlyArray<DeepReadonly<U>>
  : T extends object
    ? { readonly [K in keyof T]: DeepReadonly<T[K]> }
    : T;

const RAW_CONNECTORS_FIXTURE: ConnectorsFixture = {
  setup: {
    team: { name: 'Empty Team', slug: 'empty-team' },
    canManageConnectors: true,
    hasAnyInstallation: false,
    githubAppReady: false,
    slackAppReady: false,
    nangoConfigured: false,
    gaps: [
      { id: 'github-app', text: 'The GitHub App is not configured for this team yet.' },
      { id: 'slack-app', text: 'The Slack application is not configured for this team yet.' },
      { id: 'nango-client', text: 'The OAuth broker is not configured, so new provider connections cannot start.' },
    ],
  },
  operating: {
    team: { name: 'Relay Team', slug: 'relay-team' },
    hasAnyInstallation: true,
    github: {
      uuid: '00000000-0000-4000-8000-000000098765',
      externalAccountLabel: 'acme-org',
      health: 'active',
      isEnabled: true,
      admittedRepositories: ['acme-org/widget'],
      mappingCount: 0,
      manageUrl: 'https://github.com/organizations/acme-org/settings/installations/98765',
    },
    gitlab: {
      uuid: '00000000-0000-4000-8000-000000002001',
      externalAccountLabel: 'acme',
      health: 'active',
      isEnabled: true,
      mappingCount: 0,
    },
    relay: {
      deploymentId: 'zg-relay-team',
      state: 'active',
      providerLabel: 'Docker (local)',
      lastActiveAt: '2026-09-10T08:00:00Z',
      lastError: '',
    },
    slack: {
      workspaceName: 'Acme Workspace',
      channelName: 'team-moments',
      isReady: false,
      lastErrorCode: 'invalid_auth',
    },
  },
  handoff: {
    team: { name: 'State Machine Team', slug: 'sm-team' },
    provider: 'Linear',
    variants: [
      {
        flow: 'installation',
        phase: 'waiting',
        team: { name: 'State Machine Team', slug: 'sm-team' },
        provider: 'Linear',
        entry: { method: 'GET', path: '/a/sm-team/connectors/install/linear/' },
        back: '/a/sm-team/connectors/',
        failure: null,
      },
      {
        flow: 'reconnect',
        phase: 'completing',
        team: { name: 'State Machine Team', slug: 'sm-team' },
        provider: 'Linear',
        entry: {
          method: 'POST',
          path: '/a/sm-team/connectors/install/00000000-0000-4000-8000-000000000003/reconnect/',
        },
        back: '/a/sm-team/connectors/',
        failure: null,
      },
      {
        flow: 'user-link',
        phase: 'failed',
        team: { name: 'State Machine Team', slug: 'sm-team' },
        provider: 'Linear',
        entry: {
          method: 'POST',
          path: '/a/sm-team/connectors/link/00000000-0000-4000-8000-000000000003/',
        },
        back: '/a/sm-team/connectors/install/00000000-0000-4000-8000-000000000003/?tab=links',
        failure: 'Installation failed: connection failed — no connection ID received from the provider broker.',
      },
    ],
  },
  githubAppFailure: {
    heading: 'GitHub App setup failed',
    subtitle: 'Spec Kitty could not finish connecting the GitHub App to this team.',
    variants: [
      {
        id: 'resolved-team',
        team: { name: 'Team A', slug: 'team-a' },
        error: 'Could not verify your GitHub account for this installation. Please try again.',
        backHref: '/a/team-a/connectors/',
      },
      {
        id: 'no-team-boundary',
        team: null,
        error: "This install link is invalid or has expired. Please start again from this team's Connectors page.",
        backHref: null,
      },
    ],
  },
  gitlabGroup: {
    team: { name: 'GL Select Team', slug: 'gl-select-team' },
    installationUuid: '00000000-0000-4000-8000-000000000005',
    groups: [
      { id: '2001', name: 'acme', display: 'Acme' },
      { id: '2002', name: 'acme/platform', display: 'Acme / Platform' },
    ],
    connectedGroup: { id: '2001', name: 'acme', display: 'Acme' },
    selectionMethod: 'POST',
    selectionPath: '/a/gl-select-team/connectors/install/00000000-0000-4000-8000-000000000005/gitlab-group/',
    refreshMethod: 'POST',
    refreshPath: '/a/gl-select-team/connectors/install/00000000-0000-4000-8000-000000000005/gitlab-refresh/',
    failures: {
      missing: 'Please choose a GitLab group.',
      manualRefresh: 'Failed to refresh repositories. Please try again.',
      list: 'Could not list your GitLab groups. Please try reconnecting.',
    },
  },
  slackChannelPicker: {
    team: { name: 'State Machine Team', slug: 'sm-team' },
    workspaceName: 'Collaborative Demo Workspace',
    choosePath: '/a/sm-team/connectors/slack/channels/choose/',
    laterPath: '/a/sm-team/connectors/',
    projections: {
      populated: {
        channels: [
          { id: 'C01GENERAL', name: 'general' },
          { id: 'C02ENGINEERING', name: 'engineering' },
          { id: 'C03TEAMMOMENTS', name: 'team-moments' },
          { id: 'C04PRODUCTUPDATES', name: 'product-updates' },
          { id: 'C05RELEASEROOM', name: 'release-room' },
        ],
        selectedChannelId: 'C03TEAMMOMENTS',
        channelsComplete: true,
        errorMessage: null,
      },
      empty: {
        channels: [],
        selectedChannelId: '',
        channelsComplete: true,
        errorMessage: null,
      },
      refused: {
        channels: [],
        selectedChannelId: '',
        channelsComplete: true,
        errorMessage:
          'Could not read your Slack channels (invalid_auth). Disconnect and connect Slack again; if it keeps failing, the app may need reinstalling in your workspace.',
      },
      'rate-limited': {
        channels: [],
        selectedChannelId: '',
        channelsComplete: true,
        errorMessage: "Slack is asking us to slow down. Try reloading this page in a moment — this isn't a problem with your connection.",
      },
      incomplete: {
        channels: [
          { id: 'C01GENERAL', name: 'general' },
          { id: 'C03TEAMMOMENTS', name: 'team-moments' },
          { id: 'C05RELEASEROOM', name: 'release-room' },
        ],
        selectedChannelId: 'C03TEAMMOMENTS',
        channelsComplete: false,
        errorMessage:
          'This workspace has more channels than we could load in time. The list below may be incomplete — reload this page to try again.',
      },
    },
  },
};

export const CONNECTORS_FIXTURE: DeepReadonly<ConnectorsFixture> = deepFreeze(RAW_CONNECTORS_FIXTURE);
