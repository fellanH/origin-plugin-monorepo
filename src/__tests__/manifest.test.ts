import { describe, it, expect } from "vitest";
import { manifest } from "../manifest";

describe("manifest", () => {
  it("has a valid reverse-domain id", () => {
    // Must be dot-separated segments, e.g. "com.example.myplugin"
    expect(manifest.id).toMatch(/^[a-z][a-z0-9-]*(\.[a-z][a-z0-9-]*)+$/);
  });

  it("has a valid semver version", () => {
    expect(manifest.version).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it("has all required fields", () => {
    expect(manifest.id).toBeTruthy();
    expect(manifest.name).toBeTruthy();
    expect(manifest.version).toBeTruthy();
  });
});
