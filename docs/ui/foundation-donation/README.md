# SHF-DONATION-001

Current payment integration: [PAYMENT_INTEGRATION.md](PAYMENT_INTEGRATION.md). The UI now supports Stripe-hosted one-time/monthly initiation and backend-verified return states, with safe unconfigured fallback. The original implementation/audit notes below remain historical evidence.

## Architecture audit / selected route (before implementation)

Canonical route: `/foundation.html#/get-involved` (also available from the existing `shf.html` entry). Upgrade the existing generic PublicInfoPage destination; do not add a competing donation route. The shared header and closing CTA already link here. Partners remain `#/partners`; impact remains `#impact` on the homepage; public reporting remains `#/reports`.

FoundationLayout owns FoundationHeader, FoundationClosingCta, and FoundationFooter. Reuse unchanged shell composition. Official logo: `/assets/brand/shf-official-logo.webp`. Foundation palette comes from shf-home-mock.css; handwritten typography is the existing SHF Permanent Marker font. All donation CSS is scoped.

Read repository AGENTS.md; no nested instructions found in src, tests, docs or public. Working tree contains extensive unrelated work, including existing Foundation shell changes. Preserve it; no commits or deployment.

No existing donation experience or verified Foundation provider was found. `apps/shs-api/src/domain/payments/payment-readiness.ts` contains a DeterministicPaymentAdapter producing test identifiers; it is not an approved donation processor. Commercial integration descriptors also describe mock/import-only payment summaries. No Foundation analytics/event system found; do not introduce one.

## Asset boundary

Owner reference: `/Users/mikeslate/Downloads/ChatGPT Image Oct 23, 2026, 12_55_23 PM.png`.
The owner explicitly approved nine standalone photo identities in SHF-DONATION-IMAGE-002. All nine are now installed under `/assets/foundation/donation/` as high-quality WebP copies. See [APPROVED_IMAGE_INSTALL.md](APPROVED_IMAGE_INSTALL.md) and [IMAGE_INVENTORY.md](IMAGE_INVENTORY.md) for exact source mapping, dimensions, approval status and crop details. The approved collage is reference only and was not installed. No image was regenerated. Final browser visual review remains pending.

## Components and composition

`pages/Donation.jsx` composes FoundationDonationHero → FoundationDonationNav → FoundationGiftSelector + FoundationSupportImpactPanel → FoundationWaysToGive → FoundationGiftImpact → FoundationTransparency. FoundationDonationDialog owns native modal presentation. The parent FoundationLayout supplies the header, canonical gray closing CTA, then footer. No duplicate shell or global reset; no Catalog/Curriculum/SHS/backend changes.

The sole shared header change adds `aria-current="page"` to its existing Support SHF link on this route. The existing Contact links also use this same route; no new contact form or delivery address has been invented. A dedicated contact destination, if desired, requires separate route/content work. The shared ending's actions are preserved.

## Donation state and payment boundary

- Initial amount is empty; no preset or recurring gift is preselected.
- Each preset sets its USD amount and is the only pressed button.
- Typing a custom amount clears preset selection, even when matching a preset.
- Input is a labelled decimal text field to accept typed currency consistently. Exact cents are parsed without rounding; reject zero, negative, nonnumeric, exponent notation, more than two decimal places, or unsafe integer cents.
- Submit validates, focuses invalid input, and announces the inline error.
- `adapters/donationHandoff.js` accepts `{amountMinor, currency: "USD", frequency: "one-time"}` and returns an explicit `provider-unavailable` state. This is a frontend handoff seam, not a payment service.
- The modal shows the selected one-time amount, explains giving is not yet available and an approved provider must be connected, and confirms no payment was taken or amount saved.
- No fetch, donor-information fields, raw card/bank fields, storage, fake IDs, receipt, or payment-success screen. State exists only in React memory and resets on reload.
- Trust microcopy truthfully says online payments are not yet available.

## Destinations

| Control                                    | Destination / behavior                                                                        |
| ------------------------------------------ | --------------------------------------------------------------------------------------------- |
| Make a Gift / Ways to Give / Where It Goes | Focus and scroll to real local section without replacing the hash router state                |
| Impact Stories / Our Impact                | Existing `#impact` homepage region; canonical router and footer finish navigation             |
| Partner With Us                            | `#/partners`                                                                                  |
| One-Time Gift                              | Focus custom gift input and scroll to gift section                                            |
| Monthly Giving                             | Informational modal: unavailable, requires recurring terms/cancellation and approved provider |
| Corporate Support / Employer Partnerships  | `#/partners`                                                                                  |
| Grants & Foundations                       | Informational modal; no invented instructions/contact                                         |
| Planned Giving                             | Informational modal; no legal/tax guidance invented                                           |
| Financial Reports                          | Informational modal: no approved statements currently published                               |
| Governance Overview                        | Informational modal: dedicated overview unavailable                                           |
| Impact Reporting                           | Existing `#/reports`, which describes public evidence/disclosure boundaries                   |

No allocation percentages, guaranteed dollar-to-impact ratios, restrictions/designations, tax claims, matching campaigns, participant/donor figures or donor testimony were added. The supplied qualitative preset concepts are intentions, not quantified guarantees. Illustrative imagery is not evidence of actual beneficiaries.

## Accessibility and responsive implementation

One H1, section headings, USD fieldset legend and visible input label, pressed preset buttons, visible keyboard focus, announced validation errors, descriptive image alternatives, decorative SVGs hidden from assistive technology. Native dialog provides modal focus containment and Escape handling; effect cleanup returns focus to the invoking control. Main section navigation moves focus to the section. Native links preserve canonical destinations. Reduced-motion requests use immediate scrolling and suppress page transitions.

Desktop uses the mock's two-column gift/panel, six-card giving row, three-part navy band and transparency row. Under 1100px the gift panel stacks, giving cards use three columns, and impact categories wrap. Under 600px amounts use two columns, gift input/action stack, supporting photo/panel stack, cards use two columns, and impact content stacks. Section navigation scrolls within its own container. Runtime keyboard, contrast, overflow and image checks still require browser verification (see HANDOFF).

## Verification commands

Run from repository root:

```sh
node --test tests/foundationDonation.test.mjs tests/shfInstitutionalHeader.test.mjs tests/foundationGlobalClosingCta.test.mjs
./node_modules/.bin/tsc -p tests/foundation-donation.tsconfig.json
./node_modules/.bin/vite --host 127.0.0.1 --port 5191 --strictPort
./node_modules/.bin/playwright test tests/ui/foundation-donation.spec.mjs --workers=2
node docs/ui/foundation-donation/build.mjs
git diff --check
```

Focused browser specs cover 1440/1280/768/390px shell/content composition, loaded images, overflow and full-page screenshots, plus amount interactions, safe handoff, focus return, native modal containment/Escape, ephemeral state, no non-GET requests, section links, giving dialogs and canonical destinations. Shared closing-CTA browser expectation was updated from the old generic contact heading to the donation hero heading.

Scoped source lint used the repository's exact eslint.config.js, copied into `/private/tmp/shf-donation-lint/eslint.config.mjs` alongside offline-installed ESLint 9, @eslint/js, globals, react-hooks and react-refresh packages. Repository lint dependencies are absent from node_modules/package manifest; no package/lockfile changes were made. Prettier is available in the repository and checks all new source and test files.

## Review gates / future integration

1. Run browser suite successfully and inspect every screenshot directly against the owner mock. No visual completion is claimed before this.
2. Owner selects standalone final hero, support portrait, six giving photographs and impact-band portrait. Current existing Foundation images are interim candidates.
3. Owner approves a hosted donation provider, SHF account and environment, gift types and policies. Replace the isolated unavailable adapter with approved hosted checkout; verify server-created sessions, approved redirect destinations, USD minor units, errors/cancellation, receipts, idempotency and verified server webhooks before asserting success. Never collect raw card data in this frontend.
4. Publish authoritative tax/disclosure, donor-privacy, recurring-gift/cancellation and gift-acceptance information if applicable. Add provider-supported monthly giving only with explicit frequency consent.
5. Publish approved financial statements, governance content and giving instructions before replacing their unavailable states. A real contact workflow is separate future work.
