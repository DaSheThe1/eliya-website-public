# Remote R2 media implementation contract

This beta module is a selectable task contract, not a deployed Worker.
Implementation must use an explicit collection allowlist, bound response
sizes, safe content types, immutable cache keys, and a local build-time
fallback. Provider credentials remain server-only.

The Worker source, reviewed file allowlist, exact commit, and artifact
provenance are required before packaging. Until those artifacts and failure
tests exist in the generated client repository, this module blocks release.
