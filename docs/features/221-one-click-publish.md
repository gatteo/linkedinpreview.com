# Feature 221: One-Click Publish

## Goal

Let users publish their post directly to LinkedIn from the editor without leaving the app.

## Description

A "Publish to LinkedIn" button in the editor that posts the current draft directly to the user's LinkedIn profile using the LinkedIn API. Requires LinkedIn OAuth (220). After publishing, the draft status is updated to "published" with a link to the live post.

## Acceptance Criteria

- [ ] "Publish to LinkedIn" button visible in editor when LinkedIn is connected
- [ ] Button is hidden/disabled when LinkedIn is not connected
- [ ] Post is published to the user's LinkedIn profile
- [ ] Draft status updates to "published" after successful publish
- [ ] LinkedIn post URL is stored and linked from the draft
- [ ] Image/video attachments are included in the published post
- [ ] Clear error messages for API failures
- [ ] Confirmation dialog before publishing

## Technical Notes

- LinkedIn Share API: `POST https://api.linkedin.com/v2/ugcPosts` or the newer Posts API
- Server-side API route: `/api/publish` - accepts draft content, formats for LinkedIn API, posts on behalf of user
- Convert Unicode-formatted text to LinkedIn's expected format
- Handle image/video attachments: upload media to LinkedIn's asset API first, then reference in the post
- Update draft status to "published" and store the LinkedIn post URL in the draft record
- Rate limit: consider LinkedIn's own API rate limits
- Error handling: LinkedIn API errors (token expired, permission denied, content policy violation)
