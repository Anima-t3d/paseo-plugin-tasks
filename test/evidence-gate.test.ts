import { describe, expect, it } from "vitest";
import { evidenceVerdict } from "../server/bridge";

const show = (bodies: string[]) => JSON.stringify({ comments: bodies.map((body) => ({ body })) });

describe("evidenceVerdict", () => {
  it("returns null when the card carries no evidence block", () => {
    expect(evidenceVerdict(show(["Dispatched to pilot-wt", "looks good to me"]))).toBeNull();
    expect(evidenceVerdict("not json")).toBeNull();
    expect(evidenceVerdict(JSON.stringify({}))).toBeNull();
  });

  it("reads the verdict from the newest evidence block", () => {
    expect(evidenceVerdict(show([
      "**Evidence for `TASKS-1`** — FAILED CHECK\n\n**What was not covered**\n- x",
      "**Evidence for `TASKS-1`** — PASS\n\n**What was not covered**\n- nothing identified",
    ]))).toBe("PASS");
  });

  it("accepts a pass with gaps", () => {
    expect(evidenceVerdict(show([
      "**Evidence for `TASKS-1`** — PASS WITH GAPS\n\n**What was not covered**\n- shellcheck did not run",
    ]))).toBe("PASS WITH GAPS");
  });

  it("treats a block with no verdict line as incomplete", () => {
    expect(evidenceVerdict(show([
      "**Evidence for `TASKS-1`**\n\n**What was not covered**\n- everything",
    ]))).toBe("INCOMPLETE");
  });

  it("treats a block with no 'what was not covered' section as incomplete", () => {
    // The gap list is the part that stops a submission from being a bare claim, so a block
    // without it must not pass.
    expect(evidenceVerdict(show(["**Evidence for `TASKS-1`** — PASS"]))).toBe("INCOMPLETE");
  });

  it("keeps reading older comments until it finds an evidence block", () => {
    expect(evidenceVerdict(show([
      "**Evidence for `TASKS-1`** — PASS\n\n**What was not covered**\n- x",
      "thanks, shipping this",
    ]))).toBe("PASS");
  });
});
