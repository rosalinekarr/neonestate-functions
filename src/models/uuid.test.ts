import { isUUID, newUUID } from "./uuid";

describe("isUUID", () => {
  it("returns true for UUIDs", () => {
    const uuid = newUUID();
    expect(isUUID(uuid)).toBe(true);
  });

  it("returns false for non-UUID strings", () => {
    const notUuid = "non-uuid-string";
    expect(isUUID(notUuid)).toBe(false);
  });

  it("returns false for non-strings", () => {
    expect(isUUID(34)).toBe(false);
  });
});
