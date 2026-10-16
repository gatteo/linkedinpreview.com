# Carousel generation output contract

`POST /api/carousel/generate` uses a provider-only structured-output schema and returns the existing optional-field deck contract.

- `app/api/carousel/generate/route.schema.ts`: `deckSchema` is the unchanged public contract. `providerDeckSchema` makes `themeSuggestion`, slide `body`, and slide `suggestedIcon` required-nullable, so strict structured-output serialization includes every property in each object's `required` list. Object schemas retain `additionalProperties: false`.
- `normalizeProviderDeck` omits null optional fields before the handler returns JSON. Present values, including empty strings, are preserved. Slide roles, headlines and the 4-15 slide bounds are unchanged.
- `config/carousel-prompts.ts` asks for explicit null values rather than omission in generated decks. Hooks/CTA prompts are unchanged.
- `components/dashboard/carousel/editor/ai/ai-generate-dialog.tsx` still consumes optional strings and passes slides to `lib/carousel/ai-map.ts`. No client, persistence, entitlement, model, provider, authentication or limit changes are needed.

Generation errors retain HTTP 500 `GENERATION_FAILED`. Authentication and local rate-limit preconditions retain 401 and 429. Existing `check_and_record_usage` preflight accounting records the attempt before generation, including failed attempts. The repair adds no post-failure usage, success or customer-record write and does not change that pre-existing accounting policy.

Run the offline actual-module regression suite:

```sh
node --experimental-strip-types --test tests/carousel-generation-contract.test.mjs
```

The suite imports the real schema/normalizer and installed AI SDK, intercepts serialized provider requests before transport, and exercises the actual handler, prompts, limiter and client mapping in a Node VM with synthetic auth/database/provider seams. The Next font build-time macro is replaced only in the offline mapping test. Synthetic outputs are fixtures, not provider observations. No live generation, production writes, paid availability or production success rate is established by these tests.

LIN-196 diagnosis and LIN-197 authorization cover this narrow repair. The observed baseline is three retained rejected carousel IDs, with all-status denominator, unique-customer count and plan status unknown. Preserve LIN-87 monitoring and LIN-112 cohort clocks. Ship only after exact-head preview smoke and independent Sentinel approval; Atlas merges. Before merge, retain or withdraw the isolated PR. After release, rollback uses the actual isolated squash SHA through review, preserving customer/payment/cohort records.

## Per-slide editing (LIN-330)

`POST /api/carousel/edit` follows the same provider/public boundary. Its unchanged `slideSchema` accepts an optional string body. `providerSlideSchema` requires a nullable string body for strict serialization, and `normalizeProviderSlide` omits only null before returning JSON. Present strings, including empty strings, are preserved. The edit prompt requests explicit null rather than omission. The client still consumes the headline without any schema, persistence or UI changes.

Run `node --experimental-strip-types --test tests/carousel-edit-contract.test.mjs tests/carousel-generation-contract.test.mjs`. The edit suite reproduces the old missing-required-body serialization with the installed SDK, verifies the repaired wire schema, and exercises the real handler and limiter with synthetic seams. It covers all four edit actions, null/empty/present bodies, free/Pro/lifetime limits, invalid input, auth, throttling and generation failures. Existing preflight attempt accounting is unchanged, including on failure. No live provider or customer writes are permitted by these tests.

The LIN-330 source receipt retains six production edit HTTP 500 request IDs on October 15. The all-status denominator, customer plans and cash loss are unknown. This is a reliability repair, not a new offer experiment. Frozen experiment definitions and clocks remain unchanged. Offline/contained results do not establish production recovery; independent Sentinel review and Atlas release remain required.
