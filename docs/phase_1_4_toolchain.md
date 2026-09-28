# Polish with Me — Phase 1.4 Toolchain

Recorded: 15 September 2026 (Europe/London)

## Selected toolchain

- Node.js: `24.21.0` (active LTS)
- pnpm: `11.27.0`
- Node pin: root `.node-version`
- pnpm pin: root `package.json` `packageManager` field

Node 24 is an active LTS line, Expo SDK 54 supports Node 20.19.x or newer,
and the lockfile includes packages requiring Node 22.18.0 or newer. Node
24.21.0 therefore satisfies the Expo SDK 54 / React Native 0.81.5 / React 19
stack and the locked package requirements without relying on the host's
end-of-life Node 25 installation. pnpm 11.27.0 supports Node 24, lockfile
format 9.0 and the pnpm 11 workspace configuration used by this repository.

The host initially provided Node `v25.2.1` at
`C:\Program Files\nodejs\node.exe` and npm `11.6.2` at
`C:\Program Files\nodejs\npm.ps1`. Neither pnpm nor Corepack was available.

## Installation method

The official `node-v24.21.0-win-x64.zip` archive and its official
`SHASUMS256.txt` were downloaded from `nodejs.org` into a temporary directory.
The archive SHA-256 was verified as:

```text
158F7685B44DE51F6C0DF1D153526CBCD3E1BC739A8DFC607721CEF75DE9E541
```

The extracted runtime reported `v24.21.0`. pnpm `11.27.0` was invoked under
that runtime and dependencies were installed from the repository root with:

```text
pnpm install --frozen-lockfile
```

The install completed successfully for all nine workspace projects. pnpm's
supply-chain policy check passed for 1,079 lockfile entries. The permitted
`esbuild@0.27.3` postinstall ran; it recovered its platform-specific binary
through npm after the optional package was not initially present. The root
pnpm-enforcement `preinstall` script also passed.

## Lockfile policy and result

`pnpm-lock.yaml` is authoritative and installations must use
`--frozen-lockfile`. Its SHA-256 before and after installation was identical:

```text
D8459A0260A3EA9D754B9527DBBA99CD11B8D3EDCF1999B63AB57DC77A7130A8
```

Its Git blob hash also remained `9ebc172d52293028b1f930d6496538f71e979b92`.
No dependency version or lockfile content changed.

## Verification commands and results

```text
node --test artifacts/mobile/tests/quizCorrectness.test.mjs
```

Result: **passed — 12 tests, 0 failures** under Node `24.21.0`. The existing
non-failing module-type warning remains.

```text
pnpm --filter @workspace/mobile typecheck
```

Result: **passed**.

```text
pnpm run typecheck:libs
pnpm --filter @workspace/api-server typecheck
```

Result: **passed**. The library build is the repository-defined prerequisite
that generates declaration output referenced by the API TypeScript project.

```text
pnpm run typecheck
```

Result: **partially passed, then failed in the out-of-scope mockup sandbox**.
The library, mobile, API and scripts checks passed. The
`@workspace/mockup-sandbox` check reported duplicate/incompatible React ref
types in `calendar.tsx` and `spinner.tsx`. No source or dependency change was
made to mask this unrelated failure.

```text
git diff --check
```

Result: **passed**.

## Render implications

Render's existing build command already installs with a frozen lockfile and
builds the API server. Render recognizes `.node-version`, so a future Render
build from this source should select Node `24.21.0`. The `packageManager` field
records pnpm `11.27.0` for package-manager tooling that honors it.

`render.yaml` itself is unchanged. Its build and start commands still invoke
the bare `pnpm` executable, so deployment continues to depend on Render
providing or activating pnpm. Before a production deployment, confirm from a
non-production Render build log that the service actually uses pnpm `11.27.0`.
If it does not, a deployment-specific correction belongs in a later authorized
phase.

## Remaining tooling risks

- The broader workspace typecheck is not fully green because of the unrelated
  mockup-sandbox React type duplication described above.
- The `esbuild` install needed its approved postinstall fallback to obtain the
  Windows binary; future offline installations require that optional binary to
  be present in the package store.
- Render's pnpm activation behavior has not been exercised because this phase
  expressly prohibited deployment.
- The dependency installation creates ignored `node_modules` content and uses
  the user-level pnpm/npm caches; those generated files are not source inputs.
- The focused Node test emits a harmless module-type warning. No package
  metadata was broadened merely to suppress it.
