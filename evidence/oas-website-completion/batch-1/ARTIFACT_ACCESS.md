# Artifact access

The compiled five-entry static website directly serves:

| Public URL | Content | Authority source |
| --- | --- | --- |
| /oas/catalogs/OAS-1@1.0.0.json | application/json | Same path under public at publication commit |
| /oas/OAS-1@1.0.0.md | text/markdown | Same path under public at publication commit |
| /oas/currentness.json | application/json | Same path under public at publication commit |
| /oas/declaration.schema.json | application/json | schemas/oas/closure/declaration.schema.json at publication commit |

The browser suite serves the real built directory through a strict static HTTP server, with no SPA fallback. It checks status 200, MIME, no redirect, non-HTML body and complete Buffer equality to git show for every resource. Catalog raw SHA-256 is independently checked. Metadata observation retains historical references exactly; this batch does not rewrite immutable currentness or publish historical release sites.

vite.oas-website.config.mjs copies only public/oas and existing public/assets/oas into the OAS artifact. Hosting must preserve these URL paths/MIME types; no live production hosting was performed.

Independent confirmation: actual Vite preview at a temporary loopback port also returned all four files with correct MIME and exact publication bytes. See preview-responses.json. The preview was local only.
