# Feature 244: Integrations

## Goal

Connect LinkedInPreview with users' existing tools to fit into their workflow.

## Description

Third-party integrations that let users sync content between LinkedInPreview and other productivity tools. Initial integrations: Notion (sync drafts as pages), Slack (share drafts to channels, receive notifications), and Zapier/Make.com (webhook triggers for automation).

## Acceptance Criteria

- [ ] User can connect Notion account and sync drafts
- [ ] User can connect Slack and receive notifications on publish
- [ ] Webhook URL available for Zapier/Make.com automation
- [ ] Integration status visible on Settings page
- [ ] User can disconnect integrations
- [ ] Webhook events fire reliably on draft lifecycle events

## Technical Notes

- Webhook system: fire events on draft create/update/publish for Zapier/Make triggers
- Notion integration: Notion API to sync drafts as database entries or pages
- Slack integration: Slack Incoming Webhooks for notifications, Slack App for richer interaction
- Integration settings page in dashboard (or section within Settings)
- OAuth flows for Notion and Slack
- Webhook payload format: `{ event, draft: { id, title, status, content }, timestamp }`
- Store integration configurations per user in Supabase
