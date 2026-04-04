# PROJECT KNOWLEDGE BASE

**Generated:** 2026-03-30 23:42:10 CST  
**Commit:** e2b0521  
**Branch:** master

## OVERVIEW
axios-extensions is a TypeScript adapter-enhancer library for axios (cache/throttle/retry).
Source-of-truth is `src/`; `lib`/`esm`/`dist` are generated outputs.

## STRUCTURE
```text
./
├── src/                     # Runtime source, tests, utils
│   ├── AGENTS.md            # Source-module guide
│   └── utils/AGENTS.md      # Utility-layer local guide
├── lib/                     # Generated CJS build
├── esm/                     # Generated ESM build + d.ts
├── dist/                    # Generated UMD build
├── vite.config.ts           # Multi-mode library build
├── vitest.config.ts         # Test and coverage config
└── .github/workflows/       # CI + publish automation
```

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| Public API surface | `src/index.ts` | Must stay aligned with package `main/module/types` |
| Cache behavior | `src/cacheAdapterEnhancer.ts` | `cacheable` policy + key generation + `__fromCache` |
| Throttle behavior | `src/throttleAdapterEnhancer.ts` | GET-only dedupe + per-request `threshold` |
| Retry behavior | `src/retryAdapterEnhancer.ts` | global `times` + request `retryTimes` |
| Adapter resolution | `src/utils/resolveAdapter.ts` | Handles axios v1 adapter forms |
| Cache contract checks | `src/utils/isCacheLike.ts`, `src/utils/deleteCacheEntry.ts` | Supports `delete` and legacy `del` |
| Build pipeline | `package.json`, `vite.config.ts`, `tsconfig.types.json` | cjs -> esm -> umd -> umd-min |
| CI and release | `.github/workflows/*.yml`, `.releaserc.json` | CI-on-master gates semantic-release auto publish |

## CODE MAP
| Symbol | Type | Location | Role |
|--------|------|----------|------|
| `cacheAdapterEnhancer` | function | `src/cacheAdapterEnhancer.ts` | Cache wrapper around resolved adapter |
| `throttleAdapterEnhancer` | function | `src/throttleAdapterEnhancer.ts` | Threshold-window request dedupe |
| `retryAdapterEnhancer` | function | `src/retryAdapterEnhancer.ts` | Retry wrapper for failed requests |
| `Cache` | class | `src/Cache.ts` | Default in-memory cache wrapper |
| `resolveAdapter` | function | `src/utils/resolveAdapter.ts` | Normalize adapter input to function |
| `buildSortedURL` | function | `src/utils/buildSortedURL.ts` | Stable key from sorted query pairs |

## CONVENTIONS (PROJECT-SPECIFIC)
- Tabs for code; spaces for JSON/config (`.editorconfig`).
- ESLint allows `any`, enforces tabs + single quotes (`eslint.config.mjs`).
- Tests run directly from source TS via Vitest (`vitest.config.ts`, `npm test`).
- Package intentionally publishes `src` plus generated outputs (`package.json#files`).
- UMD build keeps axios external and maps global `axios` (`vite.config.ts`).

## ANTI-PATTERNS (THIS PROJECT)
- Do not edit `lib/`, `esm/`, or `dist/` directly; build regenerates them.
- Do not target axios `<1.0.0` or Node `<18`.
- Do not rely on axios `0.19.0` compatibility.
- Do not bypass source entrypoints with imports from generated folders in source code.

## UNIQUE STYLES
- Axios type augmentation is colocated inside enhancer files (`declare module 'axios'`).
- Cache compatibility keeps both `delete` and `del` paths.
- Release flow is CI-gated semantic-release: merges to `master` run CI first, then the release workflow publishes from the validated commit.

## COMMANDS
```bash
npm run lint
npm test
npm run build
npm run ci
```

## NOTES
- Keep `main`, `module`, and `types` entrypoints aligned with generated outputs.
- CI validates on Node 20.x and 22.x (`.github/workflows/ci.yml`).
- Release workflow listens for successful `CI` runs on `master` and then executes `semantic-release` (`.github/workflows/release.yml`).
