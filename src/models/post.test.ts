import { Timestamp } from "firebase-admin/firestore";
import {
  newPost,
  newPostAttachmentSection,
  newPostTextSection,
  serializePost,
} from "./post";
import { RoomType, newRoom } from "./room";
import { newUser } from "./user";
import { HttpsError } from "firebase-functions/v2/https";

const user = newUser({
  avatarPath: "path_to_avatar",
  phoneNumber: "+1234567890",
  username: "Johnny_Mnemonic",
});

const room = newRoom(user, {
  description: "Room Description",
  name: "Room_Name",
  type: RoomType.Classic,
});

describe("newPost", () => {
  it("generates a new post", () => {
    expect(
      newPost(user, {
        roomId: room.id,
        sections: [
          newPostAttachmentSection({ path: "path_to_attachment" }),
          newPostTextSection({ body: "Words words words" }),
        ],
      }),
    ).toEqual(
      expect.objectContaining({
        id: expect.stringMatching(
          /^[a-z0-9]{8}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{12}$/i,
        ),
        createdAt: expect.any(Timestamp),
        createdBy: user.id,
        roomId: room.id,
        sections: [
          expect.objectContaining({
            id: expect.stringMatching(
              /^[a-z0-9]{8}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{12}$/i,
            ),
            path: "path_to_attachment",
            type: "attachment",
          }),
          expect.objectContaining({
            id: expect.stringMatching(
              /^[a-z0-9]{8}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{12}$/i,
            ),
            body: "Words words words",
            type: "text",
          }),
        ],
        updatedAt: expect.any(Timestamp),
        updatedBy: user.id,
      }),
    );
  });

  it("requires a roomId", () => {
    expect(() => {
      newPost(user, {
        sections: [
          newPostAttachmentSection({ path: "path_to_attachment" }),
          newPostTextSection({ body: "Words words words" }),
        ],
      });
    }).toThrow(HttpsError);
  });

  it("requires post sections", () => {
    expect(() => {
      newPost(user, {
        roomId: room.id,
      });
    }).toThrow(HttpsError);
  });

  it("requires at least one post section", () => {
    expect(() => {
      newPost(user, {
        roomId: room.id,
        sections: [],
      });
    }).toThrow(HttpsError);
  });
});

describe("serializedPost", () => {
  it("serializes the given post", () => {
    const post = newPost(user, {
      roomId: room.id,
      sections: [
        newPostAttachmentSection({ path: "path_to_attachment" }),
        newPostTextSection({ body: "Words words words" }),
      ],
    });
    const serializedPost = serializePost(post);

    expect(serializedPost).toEqual(
      expect.objectContaining({
        id: expect.stringMatching(/^\w{8}-\w{4}-\w{4}-\w{4}-\w{12}$/),
        authorId: user.id,
        createdAt: expect.any(Number),
        roomId: room.id,
        sections: [
          expect.objectContaining({
            id: expect.stringMatching(
              /^[a-z0-9]{8}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{12}$/i,
            ),
            path: "path_to_attachment",
            type: "attachment",
          }),
          expect.objectContaining({
            id: expect.stringMatching(
              /^[a-z0-9]{8}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{12}$/i,
            ),
            body: "Words words words",
            type: "text",
          }),
        ],
        updatedAt: expect.any(Number),
      }),
    );
  });
});
