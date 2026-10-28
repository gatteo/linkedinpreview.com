# Post-copy job discovery (LIN-237)

One optional categorical question shown by the public tool after a visitor's second successful copy.

- Question: "What are you preparing today?"
- Options: My own LinkedIn posts / Posts for clients or a company / Ad creative / Something else
- Surfaces: top-level `/` (`homepage`) and `/formatter` (`formatter`) only. `/embed` and any framed page (third-party embeds) never show it or any automatic Tally popup. Other routes (blog tool embeds, dashboard editor) keep the legacy Tally post-copy popup, gated by the shared cooldown.
- Cadence: at most once per browser per 7 days (`localStorage['lp-post-copy-job-shown-at']`). Shares the cooldown with the legacy Tally post-copy popup in both directions (`fb_session_shown`, `fb_dismissed_at`), so a visitor never gets both prompts. On `/` and `/formatter` the question replaces the automatic Tally popup; the FAB and footer link are unchanged.
- No signup, navigation, network request of its own, AI/provider or payment call. Storage errors suppress the question and never break copy.

## Events

| Event                     | When                                                                        | Properties                            |
| ------------------------- | --------------------------------------------------------------------------- | ------------------------------------- |
| `post_copy_job_eligible`  | Copy reached the 2-copy threshold on an allowed surface and cadence permits | `source`, `experiment_overlap`        |
| `post_copy_job_exposed`   | Question actually mounted in the DOM (denominator for response rate)        | `source`, `experiment_overlap`        |
| `post_copy_job_answered`  | Visitor picked one option (first answer only, then the card closes)         | `source`, `experiment_overlap`, `job` |
| `post_copy_job_dismissed` | Visitor closed the card with the X button or Escape, without answering      | `source`, `experiment_overlap`        |

- `source`: `homepage` | `formatter`
- `job`: `own_posts` | `client_company_posts` | `ad_creative` | `other`
- `experiment_overlap`: `local_marker_present` when a readable `lp-draft-first:*` or `lp-monthly-offer:*` assignment marker exists in this browser, else `unknown`. It is not proof of non-enrollment and carries no identifier.
- Device split: use PostHog's automatic `$device_type`. Missing response (exposed, neither answered nor dismissed) stays distinct from dismissal. No raw draft text or free-text answer is recorded.
