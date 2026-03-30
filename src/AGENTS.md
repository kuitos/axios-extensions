# SOURCE MODULE GUIDE

**Scope:** `src/**`
**Parent:** `../AGENTS.md`
**Child Guide:** `./utils/AGENTS.md`

## OVERVIEW
`src` contains all runtime behavior; generated directories must not be used as editing targets.

## STRUCTURE
```text
src/
├── index.ts                     # Public export surface
├── Cache.ts                     # Default cache implementation
├── cacheAdapterEnhancer.ts      # Cache enhancer
├── throttleAdapterEnhancer.ts   # Throttle enhancer
├── retryAdapterEnhancer.ts      # Retry enhancer
├── __tests__/                   # Enhancer behavior tests
└── utils/
    ├── buildSortedURL.ts        # Deterministic URL/key helper
    ├── isCacheLike.ts           # Cache contract runtime guard
    ├── resolveAdapter.ts        # Axios adapter resolver
    └── __tests__/               # Utility tests
```

## WHERE TO LOOK
| Change Goal | Primary File | Secondary Impact |
|-------------|--------------|------------------|
| Public API export changes | `index.ts` | update tests and distribution checks |
| Cache defaults/TTL/key behavior | `cacheAdapterEnhancer.ts` | `utils/buildSortedURL.ts`, cache tests |
| Throttle semantics | `throttleAdapterEnhancer.ts` | throttle tests |
| Retry semantics | `retryAdapterEnhancer.ts` | retry tests |
| Cache storage internals | `Cache.ts` | cache + enhancer tests |
| Custom cache compatibility | `utils/isCacheLike.ts` | all enhancer tests using custom cache |

## CONVENTIONS (LOCAL)
- Keep axios module augmentation (`declare module 'axios'`) in the enhancer that owns that config field.
- Preserve `ICacheLike` compatibility path for both `.delete()` and `.del()`.
- Keep helper utilities side-effect free; enhancer files own request-flow side effects.
- Keep tests colocated under `__tests__` with `test-*.ts` naming.
- Keep adapter handling through `utils/resolveAdapter.ts` for axios v1 compatibility.

## TESTING RULES (LOCAL)
- Use Vitest assertions and Sinon spies (current suite style).
- For enhancer behavior changes, update both success path and error path assertions.
- For cache/throttle paths, assert adapter call counts in addition to response assertions.
- Preserve browser-safety expectations (`process` can be undefined) in enhancer tests.

## ANTI-PATTERNS
- Do not import from `lib/`, `esm/`, or `dist/` inside `src`.
- Do not bypass `resolveAdapter` in enhancers when handling adapter config.
- Do not remove legacy cache method support (`del`) unless coordinated as breaking change.
