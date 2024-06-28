import { Timestamp } from "firebase-admin/firestore";
import { newRecord, serializeRecord } from "./record";
import { newUser } from "./user";

const user = newUser({
  avatarPath: "path_to_avatar",
  phoneNumber: "+1234567890",
  username: "Johnny_Mnemonic",
});

describe("newRecord", () => {
  it("generates a record with a new id", () => {
    expect(newRecord(user)).toEqual(
      expect.objectContaining({
        id: expect.stringMatching(
          /^[a-z0-9]{8}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{12}$/i,
        ),
        createdAt: expect.any(Timestamp),
        createdBy: user.id,
        updatedAt: expect.any(Timestamp),
        updatedBy: user.id,
      }),
    );
  });

  it("generates a record with new timestamps for createdAt and updatedAt", () => {
    const record = newRecord(user);
    expect(record.createdAt).toBeInstanceOf(Timestamp);
    expect(Math.abs(record.createdAt.seconds - Date.now() / 1000)).toBeLessThan(
      1,
    );
    expect(record.updatedAt).toBeInstanceOf(Timestamp);
    expect(Math.abs(record.updatedAt.seconds - Date.now() / 1000)).toBeLessThan(
      1,
    );
  });
});

describe("serializeRecord", () => {
  it("converts timestamps to unix epoch numbers", () => {
    const record = newRecord(user);
    const serializedRecord = serializeRecord(record);

    expect(serializedRecord).toEqual(
      expect.objectContaining({
        id: expect.stringMatching(/^\w{8}-\w{4}-\w{4}-\w{4}-\w{12}$/),
        createdAt: expect.any(Number),
        updatedAt: expect.any(Number),
      }),
    );
  });

  it("returns only the id and deleted timestamp when deleted", () => {
    const record = newRecord(user);

    record.deletedAt = Timestamp.now();
    record.deletedBy = user.id;

    const serializedRecord = serializeRecord(record);

    expect(serializedRecord).toEqual(
      expect.objectContaining({
        id: expect.stringMatching(/^\w{8}-\w{4}-\w{4}-\w{4}-\w{12}$/),
        deletedAt: expect.any(Number),
      }),
    );
  });
});
