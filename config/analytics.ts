// ---------------------------------------------------------------------------
// Analytics constants shared by client and server capture paths.
// ---------------------------------------------------------------------------

// Stamped on every onboarding event (client via track(), server via the
// onboarding routes) so funnels are always compared within one flow shape.
// Bump on any STRUCTURAL change to the funnel (step added/removed/reordered);
// copy-only experiments keep the version and vary by feature-flag properties.
// v3 = the 17-step audit funnel (v1 = wizard, v2 = 13-step flow).
export const OB_FUNNEL_VERSION = 'v3'
