import { Timestamp } from "firebase-admin/firestore";
import { RoomType, newRoom, serializeRoom } from "./room";
import { newUser } from "./user";
import { HttpsError } from "firebase-functions/v2/https";
import { PermissionType, newPermission } from "./permission";

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
        type: RoomType.Classic,
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
        type: RoomType.Classic,
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
        type: RoomType.Classic,
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
        type: RoomType.Classic,
        updatedAt: expect.any(Timestamp),
        updatedBy: user.id,
      }),
    );
  });

  it("requires a name", () => {
    expect(() => {
      newRoom(user, {
        description: "Room Description",
        type: RoomType.Classic,
      });
    }).toThrow(HttpsError);
  });

  it("requires a type", () => {
    expect(() => {
      newRoom(user, {
        description: "Room Description",
        name: "Room_Name",
      });
    }).toThrow(HttpsError);
  });

  it("validates room type", () => {
    expect(() => {
      newRoom(user, {
        description: "Room Description",
        name: "Room Name",
        type: "not-a-room-type",
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
      type: RoomType.Classic,
    });
    const serializedRoom = serializeRoom(room, user);

    expect(serializedRoom).toEqual(
      expect.objectContaining({
        id: expect.stringMatching(/^\w{8}-\w{4}-\w{4}-\w{4}-\w{12}$/),
        createdAt: expect.any(Number),
        description: "Room Description",
        name: "Room_Name",
        permissions: [],
        type: RoomType.Classic,
        updatedAt: expect.any(Number),
      }),
    );
  });

  it("includes permissions for the given user when present", () => {
    const room = newRoom(user, {
      description: "Room Description",
      name: "Room_Name",
      type: RoomType.Classic,
    });
    room.permissions = [
      newPermission(user, PermissionType.Ban),
      newPermission(user, PermissionType.Censor),
      newPermission(user, PermissionType.Edit),
    ];
    const serializedRoom = serializeRoom(room, user);

    expect(serializedRoom).toEqual(
      expect.objectContaining({
        permissions: expect.arrayContaining([
          {
            id: expect.stringMatching(/^\w{8}-\w{4}-\w{4}-\w{4}-\w{12}$/),
            type: PermissionType.Ban,
          },
          {
            id: expect.stringMatching(/^\w{8}-\w{4}-\w{4}-\w{4}-\w{12}$/),
            type: PermissionType.Censor,
          },
          {
            id: expect.stringMatching(/^\w{8}-\w{4}-\w{4}-\w{4}-\w{12}$/),
            type: PermissionType.Edit,
          },
        ]),
      }),
    );
  });

  it("does not include permissions for the other users", () => {
    const otherUser = newUser({
      avatarPath: "path_to_other_avatar",
      phoneNumber: "+15558675309",
      username: "Other_User",
    });
    const room = newRoom(user, {
      description: "Room Description",
      name: "Room_Name",
      type: RoomType.Classic,
    });
    room.permissions = [
      newPermission(user, PermissionType.Ban),
      newPermission(otherUser, PermissionType.Censor),
      newPermission(otherUser, PermissionType.Edit),
    ];
    const serializedRoom = serializeRoom(room, user);

    expect(serializedRoom).toEqual(
      expect.objectContaining({
        permissions: expect.arrayContaining([
          {
            id: expect.stringMatching(/^\w{8}-\w{4}-\w{4}-\w{4}-\w{12}$/),
            type: PermissionType.Ban,
          },
        ]),
      }),
    );

    expect(serializedRoom).not.toEqual(
      expect.objectContaining({
        permissions: expect.arrayContaining([
          {
            id: expect.stringMatching(/^\w{8}-\w{4}-\w{4}-\w{4}-\w{12}$/),
            type: PermissionType.Censor,
          },
          {
            id: expect.stringMatching(/^\w{8}-\w{4}-\w{4}-\w{4}-\w{12}$/),
            type: PermissionType.Edit,
          },
        ]),
      }),
    );
  });
});
