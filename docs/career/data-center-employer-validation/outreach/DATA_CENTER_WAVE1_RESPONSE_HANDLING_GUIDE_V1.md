# Data Center & AI Infrastructure — Wave 1 Response Handling Guide v1

How SHF should handle each realistic response type once contact is actually made (not yet done as of this document). Applies to all three Wave 1 organizations. Governing rule throughout: **no response type, however positive, produces an EMPLOYER REVIEWED or EMPLOYER VALIDATED outcome by itself** — those require the actual sufficiency conditions in the Validation Record, not an inference from tone.

## A. YES — willing to review

- **What SHF should do next:** send the full attachment package (per the Final Send Packet's per-organization list); move the Outreach Log's `contact_status` to reflect a response and begin tracking `reviewer_identity` once a specific person is named by them.
- **What status may change:** contact state advances to `RESPONSE_RECEIVED`, then `REVIEWER_CONFIRMED` once a specific reviewer is named.
- **What must NOT be inferred:** that a review will actually be completed, or that any specific outcome (Reviewed vs. Validated) is likely.
- **What evidence should be retained:** the response itself (date, channel, who replied), and the name/role of whoever will be reviewing, once known.

## B. MAYBE — wants more information

- **What SHF should do next:** answer their specific questions using only material already in the approved package/questionnaire — do not improvise new claims. Offer a call or written follow-up, whichever they prefer.
- **What status may change:** none yet — remains `RESPONSE_RECEIVED` until they decide.
- **What must NOT be inferred:** that "maybe" leans toward yes; treat it as genuinely undecided.
- **What evidence should be retained:** their specific questions and SHF's answers, for consistency if a later reviewer at the same organization asks the same things.

## C. WRONG CONTACT

- **What SHF should do next:** politely ask if they can redirect to the appropriate person/department; do not re-send the full package to a new address without confirming it first.
- **What status may change:** none — remains `APPROVED_FOR_CONTACT` or `CONTACT_SENT` with a note that the route needs correction.
- **What must NOT be inferred:** that the organization is uninterested — a wrong contact is a routing problem, not a decline.
- **What evidence should be retained:** the corrected contact information, sourced from what they tell SHF directly (this becomes a real, first-party-confirmed contact — a stronger source than any public-record research).

## D. DECLINE

- **What SHF should do next:** thank them, confirm no further follow-up is wanted, and do not re-contact this organization for this cohort.
- **What status may change:** contact state moves to a terminal `RESPONSE_RECEIVED` state with outcome "declined" — no further lifecycle progression.
- **What must NOT be inferred:** any negative judgment about the curriculum itself — a decline is not a review outcome and must never be recorded as one (not "Reviewed — Changes Required," not anything).
- **What evidence should be retained:** the decline itself and any reason given, since it may be useful for Wave 2/3 planning (e.g., "not the right fit right now" vs. "not our area").

## E. NO RESPONSE

- **What SHF should do next:** one polite, low-pressure follow-up after a reasonable interval (this document does not set a specific number of days, since that is an SHF operational decision, not a research finding); if still no response after that, move to the next candidate in the cohort rather than repeatedly following up.
- **What status may change:** remains `CONTACT_SENT` / `RESPONSE_PENDING`.
- **What must NOT be inferred:** that no response means decline, disinterest, or agreement — it means only that no response has been received.
- **What evidence should be retained:** dates of the original contact and any follow-up attempts.

## F. INTERESTED IN PARTNERSHIP BUT NOT REVIEW

- **What SHF should do next:** thank them, clarify that a review is still the specific ask being made right now, and separately note their partnership interest for a future, distinct conversation (per the Partnership Options section of the main package) — do not let partnership interest substitute for the review itself.
- **What status may change:** none for the validation lifecycle; a separate, informal note of partnership interest may be kept outside this cohort's tracking.
- **What must NOT be inferred:** that partnership interest implies they endorse or have reviewed the curriculum — it does not.
- **What evidence should be retained:** the partnership interest itself, filed separately from any review-outcome record, and never merged with it.

## G. INTERESTED IN WORK-BASED LEARNING

- **What SHF should do next:** same as F — acknowledge interest, keep it as a separate future conversation, and continue to pursue the review as the current, distinct ask.
- **What status may change:** none for the validation lifecycle.
- **What must NOT be inferred:** that work-based-learning interest constitutes any review, validation, or commitment — per the package's own repeated statement, work-based learning is explicitly not part of this request.
- **What evidence should be retained:** the expressed interest, kept separate from review-tracking records, for potential future reference when/if a real work-based-learning initiative is scoped.

## H. PROVIDES INFORMAL FEEDBACK WITHOUT COMPLETING REVIEW

- **What SHF should do next:** thank them for the informal input, record it accurately as informal (not as a completed Core questionnaire), and ask if they'd be willing to formalize it via the actual questionnaire — but do not treat their informal comments as equivalent to a completed review.
- **What status may change:** contact state may sit at `RESPONSE_RECEIVED` or `REVIEW_IN_PROGRESS` at most — never `REVIEW_COMPLETED` or `EVIDENCE_RECORDED` from informal feedback alone.
- **What must NOT be inferred:** that informal comments, however substantive or positive, satisfy the sufficiency requirements for Employer Reviewed (which requires the completed Core questionnaire and identity) or Employer Validated (which requires much more, per the Validation Record's sufficiency rule).
- **What evidence should be retained:** the informal feedback verbatim, clearly labeled as informal and incomplete, in case it is useful context later — but not entered into the Feedback Record as if it were a completed review.

## Cross-Cutting Reminders

- Every response, of any type, should be logged in the Outreach Log (`DATA_CENTER_WAVE1_OUTREACH_LOG_V1.json`) with a real date and real content — never a placeholder or assumed value.
- No response type in this guide, by itself, ever justifies changing the Data Center pathway's `PREPARE` / `NOT REVIEWED` status. That change requires actually completed review evidence meeting the standard's own sufficiency bar.
