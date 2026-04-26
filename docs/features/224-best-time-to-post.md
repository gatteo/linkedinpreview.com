# Feature 224: Best Time to Post

## Goal

Help users publish at the optimal time for maximum engagement.

## Description

AI-recommended posting times based on the user's content strategy, audience timezone, and historical engagement data. Suggestions appear when scheduling a post and in the content calendar. Initially based on general LinkedIn best practices; later enhanced with the user's own performance data (from 230).

## Acceptance Criteria

- [ ] Suggested posting times shown when scheduling a post
- [ ] Recommendations consider the user's audience timezone
- [ ] Best time slots highlighted in the content calendar
- [ ] Recommendations improve with user's own data when available (Phase 2)

## Technical Notes

- Phase 1: Static recommendations based on industry best practices (e.g. Tuesday-Thursday, 8-10am target audience timezone)
- Phase 2: Personalized recommendations using the user's own post performance data (requires 230)
- Display as suggested time slots when scheduling (222)
- Highlight recommended slots in the content calendar (223)
- Consider audience timezone from strategy settings (200)
- No dedicated API route needed for Phase 1 - client-side logic
