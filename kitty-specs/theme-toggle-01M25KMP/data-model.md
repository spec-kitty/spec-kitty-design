# Conceptual model — theme preference

This mission has no persisted server/domain data model. Its observable state contract is:

| Concept | Values / attributes | Rules |
|---|---|---|
| Theme preference | `system` \| `light` \| `dark` | Public three-state value; missing/invalid storage becomes `system`. |
| Resolved theme | `light` \| `dark` | Manual preference resolves directly; `system` resolves from the OS media query. |
| Stored preference | one namespaced localStorage entry | Accepted values only; unavailable/throwing storage degrades without blocking the UI. |
| Root theme state | `document.documentElement.dataset.theme`; root `color-scheme` | Both always match the resolved theme while JavaScript enhancement is active. |
| System source | `prefers-color-scheme: dark` match result | Observed live only while the effective preference is `system`; listener is removed otherwise and on disconnect. |
| Control selection | one of the three preferences | A labelled single-choice group communicates the current preference textually and supports native keyboard operation. |

Relationships:

```text
stored preference --validates--> preference --resolves with system source--> resolved theme
       control --------changes------^                              |
                                                                 applies
                                                                   v
                                                        root theme state
```

The pre-paint bootstrap and custom element are two delivery surfaces of this one contract, not separate models. Factory Dashboard application data has no relationship to this model beyond consuming the public element/bootstrap contract.
