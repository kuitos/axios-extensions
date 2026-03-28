# PROJECT KNOWLEDGE BASE

**Generated:** 2026-03-29 00:39:53 CST  
**Commit:** 0ff55dc  
**Branch:** feat/browser-friendly-cache

## OVERVIEW
axios-extensions is a TypeScript library adding adapter enhancers for axios (cache, throttle, retry).
It ships CJS (`lib`), ESM (`esm`), and browser UMD (`dist`) outputs from one source tree.

## STRUCTURE
```text
./
├── src/                     # Source of truth: enhancers + utils + tests
│   ├── __tests__/           # Enhancer-level tests
│   └── utils/__tests__/     # Utility-level tests
├── lib/                     # CJS build output (generated)
├── esm/                     # ESM build output + .d.ts (generated)
├── dist/                    # UMD outputs (generated)
├── vite.config.ts           # Multi-mode build for cjs/esm/umd/umd-min
├── vitest.config.ts         # Test + coverage configuration
└── .github/workflows/       # CI + publish workflows
```

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| Public exports | `src/index.ts` | Keep API surface stable for `main/module/types` fields |
| Cache behavior | `src/cacheAdapterEnhancer.ts` | GET-only cache path, cache key from sorted URL |
| Throttle behavior | `src/throttleAdapterEnhancer.ts` | Threshold window + in-flight dedupe |
| Retry behavior | `src/retryAdapterEnhancer.ts` | Request-level override via `retryTimes` |
| Cache abstraction | `src/Cache.ts`, `src/utils/isCacheLike.ts` | Supports `delete` and backward-compatible `del` |
| URL normalization | `src/utils/buildSortedURL.ts` | Uses `axios.getUri` and sorted query pairs |
| Test cases | `src/**/__tests__/*.ts` | Vitest + Sinon style |
| Build/distribution | `package.json`, `vite.config.ts`, `tsconfig.types.json` | Preserve all three output families |

## CODE MAP
| Symbol | Type | Location | Role |
|--------|------|----------|------|
| `cacheAdapterEnhancer` | function | `src/cacheAdapterEnhancer.ts` | Cache wrapper around resolved adapter |
| `throttleAdapterEnhancer` | function | `src/throttleAdapterEnhancer.ts` | Time-window request throttle/dedupe |
| `retryAdapterEnhancer` | function | `src/retryAdapterEnhancer.ts` | Retry failed requests |
| `Cache` | class | `src/Cache.ts` | Default lightweight cache implementation |
| `buildSortedURL` | function | `src/utils/buildSortedURL.ts` | Deterministic request key builder |
| `isCacheLike` | function | `src/utils/isCacheLike.ts` | Runtime contract check for custom caches |

## CONVENTIONS (PROJECT-SPECIFIC)
- Indentation uses tabs for code; JSON and selected config use spaces (`.editorconfig`).
- ESLint allows `any` but enforces tab indentation and single quotes (`eslint.config.mjs`).
- Tests run directly from source TypeScript via Vitest (`npm test`), not compiled test artifacts.
- Build is mode-split Vite pipeline: `cjs -> esm -> umd -> umd-min`.
- Package intentionally publishes `src` in addition to build outputs (`package.json#files`).

## ANTI-PATTERNS (THIS PROJECT)
- No explicit `DO NOT/NEVER` markers are defined in repository text.
- Treat compatibility constraint as hard rule: axios `0.19.0` is unsupported (README note).

## UNIQUE STYLES
- Axios type augmentation is colocated in enhancer files via `declare module 'axios'`.
- Cache APIs accept both modern `delete` and legacy `del` semantics.
- Release flow is split: version/tag via `np --no-publish`; actual publish in GitHub Action.

## COMMANDS
```bash
npm run lint
npm test
npm run build
npm run ci
npm run release
```

## NOTES
- Keep `main`, `module`, and `types` entrypoints aligned with generated outputs.
- UMD builds must keep `axios` external and map global to `axios`.
- Pre-push hook runs lint; local pushes fail if lint fails.
