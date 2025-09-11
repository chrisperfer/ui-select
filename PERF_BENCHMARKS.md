# UI-Select Performance Benchmarks

This doc explains how to run and interpret the lightweight benchmarks included in this repo. These probes are not strict performance tests; they log timings to help track trends while we iterate on optimizations.

## Running Benchmarks
- Build deps: `npm install`
- Build library: `gulp build` (optional; `bench` builds via Karma config)
- Run benchmarks: `npm run bench`
  - Uses `karma.bench.conf.js` (Chrome by default; Firefox on CI)
  - Outputs timing logs to the console (see below)

## What’s Measured
The suite runs two probes from `test/perf/ui-select.perf.bench.js`:
- Render/open/search (1000 items, multiple): logs `compile(ms)`, `open(ms)`, `search(ms)`
- Select/remove with `preserveArrayReference` enabled (500 items): logs `select-2(ms)`, `remove-1(ms)`

Example output:
```
[ui-select bench] compile(ms)= 34.30 open(ms)= 167.00 search(ms)= 36.90
[ui-select bench] select-2(ms)= 5.10 remove-1(ms)= 1.10
```

## Adjusting Scale
Edit `test/perf/ui-select.perf.bench.js`:
- Change dataset size in `compileWithItems(count, multiple)` calls (e.g., 2000 for stress).
- Toggle `multiple` to compare single vs multi-select.
- Modify search string to simulate different match densities.

## Interpreting Results
- Use relative deltas across commits or branches on the same machine.
- Expect variability between runs; compare averages over several runs for signal.
- Large regressions (>20–30%) should trigger investigation (watcher counts, DOM work, O(n²) paths).

## Tips for Local Runs
- Close heavy apps and browser tabs to reduce noise.
- Headless Chrome: set `CHROME_BIN` if running in CI/containers.
- If Karma cannot bind to a port, ensure no other instance is running.

## Next Targets
- Add probes for grouped choices, tagging, and long selection lists.
- Track GC pressure by measuring allocations in Chrome DevTools when feasible.
