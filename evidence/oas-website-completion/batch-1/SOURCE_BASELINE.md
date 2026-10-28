# Source baseline

Starting branch: feature/autonomous-registry-phase1. Starting HEAD: dcf2823440fb392c9f908edd20d92608b762fb96.

Cause: the active branch lacked public/oas; the frozen publication commit exists in local Git but is not an ancestor of this checkout. Vite therefore served its HTML fallback for nonexistent artifact URLs. Existing bytes were not being hidden by routing.

User-approved bounded integration: git show 9fc98273119dd1ccb43078b56abb1de02071214f:<path>, copied as raw bytes. No merge, reset, content reconstruction or normative edits. Restore the final catalog, Markdown and currentness. Expose the exact published schemas/oas/closure/declaration.schema.json as public/oas/declaration.schema.json. The older root declaration schema is legacy 1.0.0 and was not substituted for the final closure contract 1.1.0.

The incoming 271 modified tracked files were hashed before work and remain byte-identical, including package.json and root vite.config.js. Existing unrelated untracked files were not edited or staged. A separate Vite configuration avoids touching those incoming files. No Registry repository changes.
