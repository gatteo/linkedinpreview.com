# Feature 240: Team Collaboration

## Goal

Enable teams to collaborate on LinkedIn content with shared workspaces and approval workflows.

## Description

Shared workspace where multiple users can access the same drafts. Includes invite-by-email, role-based access (editor, reviewer, admin), comment/review workflow on drafts, and activity feed. Teams share a single branding configuration.

## Acceptance Criteria

- [ ] User can create a team and invite members
- [ ] Team members can view and edit shared drafts
- [ ] Role-based access control (editor, reviewer, admin)
- [ ] Comment/review workflow on drafts
- [ ] Activity feed showing team actions
- [ ] Shared branding configuration per team

## Technical Notes

- New data model: teams table, team_members table (user_id, team_id, role)
- Drafts gain an optional `team_id` FK for shared drafts
- RLS policies updated: team members can access team drafts based on role
- Requires upgrading from anonymous auth to email/OAuth auth for team members
- Invite flow: generate invite link or send email invitation
- Comments: new table for draft comments (user_id, draft_id, content, created_at)
- Activity feed: derived from draft updates and comments
- Consider Supabase Realtime for live collaboration updates
