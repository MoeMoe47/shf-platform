# Frozen hash verification

All four exposed resources match publication-commit Git blobs byte-for-byte. No normative content changed.

```json
{
  "publication": "9fc98273119dd1ccb43078b56abb1de02071214f",
  "artifactHash": "9ca2b2b9cc17acd419e9961387e65d0ca3de33fde557d5440f96856dc186892e",
  "requirementsHash": "37c09a8f92666b10d157d267e480296d9aa614c3299e10060aaa7b414ea50e5d",
  "scopeHash": "14be68339c76888fa1cac497564b6abd427352688ff68c531e8f46b61972d3c4",
  "files": [
    "public/oas/catalogs/OAS-1@1.0.0.json",
    "public/oas/OAS-1@1.0.0.md",
    "public/oas/currentness.json",
    "public/oas/declaration.schema.json"
  ],
  "result": "PASS: exact published bytes and frozen identity"
}
```

Requirements are hashed with the publication serializer (two-space JSON plus terminal newline). Scope bytes are independently obtained from standards/oas/closure/scope.json at the publication commit. Currentness and Markdown are exact full-byte comparisons, not merely matching selected fields.
