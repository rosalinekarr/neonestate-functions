import { Timestamp } from "firebase-admin/firestore";
import { newRoom, serializeRoom } from "./room";
import { newUser } from "./user";
import { HttpsError } from "firebase-functions/v2/https";

const user = newUser({
  avatarPath: "path_to_avatar",
  phoneNumber: "+1234567890",
  username: "Johnny_Mnemonic",
});

describe("newRoom", () => {
  it("generates a new room", () => {
    expect(
      newRoom(user, {
        backgroundPath: "path_to_background",
        description: "Room Description",
        name: "Room_Name",
      }),
    ).toEqual(
      expect.objectContaining({
        id: expect.stringMatching(
          /^[a-z0-9]{8}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{12}$/i,
        ),
        backgroundPath: "path_to_background",
        createdAt: expect.any(Timestamp),
        createdBy: user.id,
        description: "Room Description",
        name: "Room_Name",
        updatedAt: expect.any(Timestamp),
        updatedBy: user.id,
      }),
    );
  });

  it("does not require a background", () => {
    expect(
      newRoom(user, {
        description: "Room Description",
        name: "Room_Name",
      }),
    ).toEqual(
      expect.objectContaining({
        id: expect.stringMatching(
          /^[a-z0-9]{8}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{12}$/i,
        ),
        createdAt: expect.any(Timestamp),
        createdBy: user.id,
        description: "Room Description",
        name: "Room_Name",
        updatedAt: expect.any(Timestamp),
        updatedBy: user.id,
      }),
    );
  });

  it("requires a name", () => {
    expect(() => {
      newRoom(user, {
        description: "Room Description",
      });
    }).toThrow(HttpsError);
  });

  it("validates no spaces in name", () => {
    expect(() => {
      newRoom(user, {
        description: "Room Description",
        name: "Room Name",
      });
    }).toThrow(HttpsError);
  });

  it("requires a description", () => {
    expect(() => {
      newRoom(user, {
        name: "Room_Name",
      });
    }).toThrow(HttpsError);
  });
});

describe("serializedRoom", () => {
  it("serializes the given room", () => {
    const room = newRoom(user, {
      description: "Room Description",
      name: "Room_Name",
    });
    const serializedRoom = serializeRoom(room);

    expect(serializedRoom).toEqual(
      expect.objectContaining({
        id: expect.stringMatching(/^\w{8}-\w{4}-\w{4}-\w{4}-\w{12}$/),
        createdAt: expect.any(Number),
        createdBy: user.id,
        description: "Room Description",
        name: "Room_Name",
        updatedAt: expect.any(Number),
        updatedBy: user.id,
      }),
    );
  });
});
