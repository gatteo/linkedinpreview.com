# 244 — Integrations (backlog)

> Status: PLANNED · Wave: 6 · Captured: 2026-06-14
>
> Parked / not-yet-built work. When this is promoted to active work, open a ticket in
> [`../tickets/`](../tickets/) and (once shipped) graduate this file to a spec in
> [`../features/`](../features/) with verified acceptance criteria.

## What it is

- Third-party integrations that sync content between the app and other productivity tools. Initial integrations: Notion (sync drafts as pages), Slack (share drafts to channels, receive notifications), and Zapier / Make.com (webhook triggers for automation).

## Why it is parked

- Wave 6 (Advanced & Scale) in [`../ROADMAP.md`](../ROADMAP.md) has not started, and it depends on all previous waves. Each integration carries its own OAuth flow and external API surface to maintain.

## What would make it worth promoting

- Wave 6 being scheduled, plus demand signal that users want to wire the app into their existing tool stack.

## Sketched acceptance (not yet binary)

Provisional - to be hardened into stable `244-AC-K` IDs when the feature is built:

- User can connect a Notion account and sync drafts.
- User can connect Slack and receive notifications on publish.
- A webhook URL is available for Zapier / Make.com automation.
- Integration status is visible on the Settings page.
- User can disconnect integrations.
- Webhook events fire reliably on draft lifecycle events.

## Dependencies

- A webhook system firing on draft create / update / publish.
- OAuth flows for Notion and Slack, with per-user integration config stored in Supabase.
- Post statuses (063) for lifecycle events that drive notifications and webhooks.
