# Release Notes

## 1.0.0 (2026-05-16)

## 0.1.0 (2026-05-13)

### Features

- **all:** added docs
- **all:** updated scripts

### Bug Fixes

- **all:** pin Bun to 1.3.11 in CI to work around test module load regression
- **all:** preserve all module exports in test mocks to prevent CI flakiness
- **all:** remove leaking global module mocks that broke log/system-prompts specs
- **all:** remove smol and max-concurrency test flags causing CI module load failures

## 0.0.4 (2026-01-30)

### Features

- **all:** updated
- **all:** updated release

### Bug Fixes

- **all:** updated lock file

## 0.0.3 (2026-01-30)

### Features

- **all:** added release and validate scripts

## 0.0.2 (2026-01-17)

### Features

- **all:** improved forest at border

## 0.0.1 (2026-01-17)

### Features

- **all:** added decorations
- **all:** added maximum number of villagers and lazy load info. Also fix a WebGL issue
- **all:** added minimap (wip) etc
- **all:** added settings to exclude tags from the village
- **all:** added village regeneration after setting changes
- **all:** better placed houses (no overlaps)
- **all:** better positioned messages
- **all:** enabled copying chat messages
- **all:** improved note selection algorithm
- **all:** increased gap between zones and tried to fix zone overlaps
- **all:** initial version (untested)
- **all:** moved forest to become the borders of the world
- **all:** switch to classic tiles
- **all:** villagers stop moving while discussing
