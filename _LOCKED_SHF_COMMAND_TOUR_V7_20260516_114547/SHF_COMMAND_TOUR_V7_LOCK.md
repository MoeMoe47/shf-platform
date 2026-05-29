# SHF Command Tour V7 Lock

## Confirmed Working

- SHF Impact Command Center page is visible.
- Header globe logo is working.
- Brown/copper footer is working.
- Footer globe logo is working.
- Map regional layer remains working.
- STATEWIDE return button remains working.
- AI Analyst panel remains working.
- Command Tour button is visible.
- Command Tour opens successfully.
- Tour card uses clean Back / End / Next controls.
- Number dot row was removed.
- Active tour section receives SHF metallic orange glowing outline.
- Rest of page is dimmed and softly blurred.
- Tour behavior now matches the SHS Hub guided tour quality direction.
- Build passes.

## Locked Tour Behavior

The SHF tour should explain how to use the page in order, not just label sections.

Tour flow:
1. Header / reporting scope
2. KPI row
3. System context
4. Ohio map control surface
5. County focus
6. AI Analyst
7. Impact overview
8. Program health
9. Reports and briefings
10. Proof layer
11. Self-audit
12. Footer / SHF operating close

## Visual Standard

- SHS Hub-style guided tour behavior
- SHF brown/copper/orange visual system
- Metallic orange pulsing outline
- Soft background blur/dim
- Clean tour box
- Back / End / Next only
- No numbered dot row

## Safety Rule

Do not continue patching the tour with broad CSS guesses.

Future improvements should add stable data-tour-section attributes to real JSX sections and target those directly.
