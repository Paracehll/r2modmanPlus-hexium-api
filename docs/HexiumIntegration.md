# Hexium Integration in r2modman

## Overview
Hexium (hexium.gg) is an alternative/supplementary Valheim mod repository. r2modman includes built-in integration with Hexium to query and download Valheim mods published on hexium.gg alongside Thunderstore.

## Key Features
- **Enabled by Default**: Hexium package index integration is enabled by default for Valheim.
- **Package Source Abstraction**: Mod sources are modularized via the `PackageSource` interface (`thunderstore` and `hexium`).
- **Update Isolation**: Mods installed from Hexium or Hexium-only updates are isolated from batch "Update All" operations and auto-updates. Users manually trigger updates for Hexium-sourced mods.
- **15-Minute Caching & Stale Fallback**: Hexium index queries are cached for 15 minutes with stale fallback on network errors to minimize requests.

## Trust & Privacy Model
1. **Unverified Author Identity**: Hexium uses Discord authentication. Author names on Hexium cannot be cross-platform verified with Thunderstore accounts.
2. **Log Retention**: Hexium's official policy declares retaining request logs for up to 90 days.
