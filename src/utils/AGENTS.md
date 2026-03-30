# UTILS LAYER GUIDE

**Scope:** `src/utils/**`
**Parent:** `../AGENTS.md`

## OVERVIEW
Utility layer provides pure helpers for key building, adapter resolution, cache contract checks, and logging safety.

## STRUCTURE
```text
src/utils/
├── buildSortedURL.ts          # Stable request-key builder
├── deleteCacheEntry.ts        # delete/del compatibility helper
├── isCacheLike.ts             # Runtime guard + ICacheLike type
├── resolveAdapter.ts          # Axios adapter normalization
├── shouldLogInfo.ts           # process-safe logging gate
└── __tests__/                 # Utility unit tests
```

## WHERE TO LOOK
| Change Goal | Primary File | Secondary Impact |
|-------------|--------------|------------------|
| Cache key semantics | `buildSortedURL.ts` | cache/throttle enhancer behavior and tests |
| Custom cache compatibility | `isCacheLike.ts`, `deleteCacheEntry.ts` | cache + throttle error cleanup paths |
| Axios adapter input forms | `resolveAdapter.ts` | all enhancers accepting adapter name/config |
| Browser-safe logging checks | `shouldLogInfo.ts` | all enhancer info-log branches |

## CONVENTIONS (LOCAL)
- Keep helpers side-effect free and synchronous where possible.
- Keep compatibility behavior explicit: support both `delete` and legacy `del`.
- `buildSortedURL` must stay deterministic for query ordering.
- `resolveAdapter` must prefer function passthrough, fallback to `axios.getAdapter`.

## TESTING RULES (LOCAL)
- Utility tests belong in `src/utils/__tests__/` with `test-*.ts` naming.
- For key-generation changes, test query ordering and existing query-string preservation.
- For cache-like checks, keep object/function acceptance and null/primitive rejection coverage.

## ANTI-PATTERNS
- Do not add enhancer-level request-flow logic into utils.
- Do not remove `del` fallback unless coordinated as a breaking change.
- Do not make `shouldLogInfo` assume `process` exists in browser/UMD runtime.
