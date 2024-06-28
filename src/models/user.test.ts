import { HttpsError } from "firebase-functions/v2/https";
import { newUser, serializeUser } from "./user";

describe("newUser", () => {
  it("returns user with the given id if provided", () => {
    expect(
      newUser({
        id: "1234",
        avatarPath: "path_to_avatar",
        phoneNumber: "+1234567890",
        username: "Johnny_Mnemonic",
      }),
    ).toEqual(expect.objectContaining({ id: "1234" }));
  });

  it("generates an id if not provided", () => {
    expect(
      newUser({
        avatarPath: "path_to_avatar",
        phoneNumber: "+1234567890",
        username: "Johnny_Mnemonic",
      }),
    ).toEqual(
      expect.objectContaining({
        id: expect.stringMatching(
          /^[a-z0-9]{8}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{12}$/i,
        ),
      }),
    );
  });

  it("throws if avatarPath is not provided", () => {
    expect(() => {
      newUser({
        phoneNumber: "+1234567890",
        username: "Johnny_Mnemonic",
      });
    }).toThrow(HttpsError);
  });

  it("throws if phoneNumber is not provided", () => {
    expect(() => {
      newUser({
        avatarPath: "path_to_avatar",
        username: "Johnny_Mnemonic",
      });
    }).toThrow(HttpsError);
  });

  it("throws if username is not provided", () => {
    expect(() => {
      newUser({
        avatarPath: "path_to_avatar",
        phoneNumber: "+1234567890",
      });
    }).toThrow(HttpsError);
  });
});

describe("serializeUser", () => {
  it("serializes expected fields", () => {
    const user = newUser({
      id: "1234",
      avatarPath: "test_avatar_path",
      phoneNumber: "+1234567890",
      username: "Johnny_Mnemonic",
    });
    const serializedUser = serializeUser(user);

    expect(serializedUser).toEqual(
      expect.objectContaining({
        id: "1234",
        avatarPath: "test_avatar_path",
        createdAt: expect.any(Number),
        updatedAt: expect.any(Number),
        username: "Johnny_Mnemonic",
      }),
    );
  });

  it("omits phone numbers", () => {
    const user = newUser({
      id: "1234",
      avatarPath: "test_avatar_path",
      phoneNumber: "+1234567890",
      username: "Johnny_Mnemonic",
    });
    const serializedUser = serializeUser(user);

    expect(JSON.stringify(serializedUser)).not.toContain("+1234567890");
  });
});
