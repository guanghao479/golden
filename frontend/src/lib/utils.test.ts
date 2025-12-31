import { describe, expect, it } from "vitest";
import { cn } from "./utils";

describe("cn", () => {
  it("merges class names and resolves conflicts", () => {
    expect(cn("text-sm", "text-lg", "font-semibold")).toBe(
      "text-lg font-semibold",
    );
  });
});
