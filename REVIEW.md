# Evidence gate on submission

Two changes on top of upstream `main` (`6fbbf98`, released 0.1.2 / package 0.1.3). Everything in
our earlier patch set is now **upstream** and has been dropped from this branch:

| was ours | now upstream |
| --- | --- |
| declare `@getpaseo/client` (#1) | PR #4 — no direct import; `createRequire` off the CLI package |
| open an API client at startup (#2) | PR #6 — `server/daemon-connection.ts`, reusing the CLI's own client, credentials and `PASEO_HOME` |
| validate `--permission` on `preset update` (#3) | PR #4 — validated on create and update |
| map ACP permission modes (#3) | **not upstream**, kept here |
| everything else | — |

## 1. `in_review` requires evidence

`tasks_update` with `status: "in_review"` is refused unless the card's newest evidence block reads
`PASS` or `PASS WITH GAPS`. Empty, `INCOMPLETE`, `FAILED CHECK` and `NOTHING CHECKABLE` are all
refused, and the refusal happens **before** the update, so nothing changes on a rejection.

An evidence block, deliberately literal so any stamper can emit it without importing this package:

```md
**Evidence for `TASKS-1`** — PASS WITH GAPS

**What ran**
- `bash -n` → pass

**What was not covered**
- `shellcheck` did not run: not installed on this host
```

`in_review` means "submitted, please look" — the worker is *supposed* to move its own card there.
What a card must not do is claim verification without producing it. The agent may ask for review;
it may not assert that the work checks out.

The CLI path is **not** gated, so a human keeps an escape hatch, and
`PASEO_TASKS_REQUIRE_EVIDENCE=0` on the daemon turns the check off.

## 2. `accept-edits` maps to `auto-accept` on command-code

`mapPermissionModeToModeId` returns `undefined` for `command-code` in every mode except `full`, and
"no mode" means **ask**: a preset that says `accept-edits` produced six permission prompts for three
file writes. ACP providers advertise `auto-accept`, which is the mode that means the same thing, so
return it. A provider that rejects it still falls back to its own default.

## Tests

`test/evidence-gate.test.ts` covers the verdict parser (no block, newest block wins, missing verdict
line, missing "what was not covered" section). `test/tasks.test.ts` now asserts that a submission
without evidence is refused *and* that the card does not move, then that the same submission
succeeds once an evidence block exists.

```
npx tsc --noEmit -p tsconfig.json   clean
npx vitest run                      3 files, 19 tests, all pass
```

## Not addressed

The guard checks the shape of the block, not who wrote it: a worker can forge a `PASS` block. The
forgery is visible on the card and is the same text the reviewer reads, but it is a shape check, not
a signature.
