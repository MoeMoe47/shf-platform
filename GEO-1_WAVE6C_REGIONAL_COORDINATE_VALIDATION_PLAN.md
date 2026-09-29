# GEO-1 Wave 6C Regional Coordinate Validation Plan

No runtime helper or validator is implemented in this phase.

## Planned Cases

1. top-left origin and axis orientation
2. inclusive coordinate bounds
3. valid normalized coordinate
4. x below bounds
5. x above bounds
6. y below bounds
7. y above bounds
8. NaN rejection
9. Infinity rejection
10. Polygon ring closure
11. minimum valid vertices
12. zero-area rejection
13. deterministic geometry hash
14. viewport resize independence
15. Quick Map isolation
16. master-city isolation
17. camera-world isolation
18. asset-alignment requirement
19. no automatic repair
20. no implicit coordinate conversion

Expected future contract size: `20` focused cases, plus any validator cases
required by the final geometry registry schema.

## Failure Policy

Out-of-bounds, malformed, unclosed, zero-area, misaligned, unapproved, or
cross-space records fail closed. The validator does not clamp, auto-close,
simplify, repair, or transform geometry.
