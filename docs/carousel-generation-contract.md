# Carousel generation output contract

`POST /api/carousel/generate` uses a provider-only structured-output schema and returns the existing optional-field deck contract.

- `app/api/carousel/generate/route.schema.ts`: `deckSchema` is the unchanged public contract. `providerDeckSchema` makes `themeSuggestion`, slide `body`, and slide `suggestedIcon` required-nullable, so strict structured-output serialization includes every property in each object's `required` list. Object schemas retain `additionalProperties: false`.
- `normalizeProviderDeck` omits null optional fields before the handler returns JSON. Present values, including empty strings, are preserved. Slide roles, headlines and the 4-15 slide bounds are unchanged.
- `config/carousel-prompts.ts` asks for explicit null values rather than omission in generated decks. Edit and hooks/CTA prompts are unchanged.
- `components/dashboard/carousel/editor/ai/ai-generate-dialog.tsx` still consumes optional strings and passes slides to `lib/carousel/ai-map.ts`. No client, persistence, entitlement, model, provider, authentication or limit changes are needed.

Generation errors retain HTTP 500 `GENERATION_FAILED`. Authentication and local rate-limit preconditions retain 401 and 429. Existing `check_and_record_usage` preflight accounting records the attempt before generation, including failed attempts. The repair adds no post-failure usage, success or customer-record write and does not change that pre-existing accounting policy.

Run the offline actual-module regression suite:

```sh
node --experimental-strip-types --test tests/carousel-generation-contract.test.mjs
```

The suite imports the real schema/normalizer and installed AI SDK, intercepts serialized provider requests before transport, and exercises the actual handler, prompts, limiter and client mapping in a Node VM with synthetic auth/database/provider seams. The Next font build-time macro is replaced only in the offline mapping test. Synthetic outputs are fixtures, not provider observations. No live generation, production writes, paid availability or production success rate is established by these tests.

LIN-196 diagnosis and LIN-197 authorization cover this narrow repair. The observed baseline is three retained rejected carousel IDs, with all-status denominator, unique-customer count and plan status unknown. Preserve LIN-87 monitoring and LIN-112 cohort clocks. Ship only after exact-head preview smoke and independent Sentinel approval; Atlas merges. Before merge, retain or withdraw the isolated PR. After release, rollback uses the actual isolated squash SHA through review, preserving customer/payment/cohort records.
