import {
  CollectionReference,
  DocumentData,
  Firestore,
  Query,
  Timestamp,
} from "firebase-admin/firestore";
import { Record, newRecord, serializeRecord } from "./record";
import { UUID, isUUID, newUUID } from "./uuid";
import { User } from "./user";
import { InvalidArgumentError } from "./error";

export type PostAttachmentSection = {
  id: UUID;
  type: "attachment";
  path: string;
};

export type PostTextSection = {
  id: UUID;
  type: "text";
  body: string;
};

export type PostSection = PostAttachmentSection | PostTextSection;

export type Post = Record & {
  sections: PostSection[];
  roomId: UUID;
};

export function isPostAttachmentSection(x: any): x is PostAttachmentSection {
  return x?.type === "attachment" && typeof x?.path === "string";
}

export function isPostTextSection(x: any): x is PostTextSection {
  return x?.type === "text" && typeof x?.body === "string";
}

export function isPostSection(x: any): x is PostSection {
  return isUUID(x?.id) && (isPostAttachmentSection(x) || isPostTextSection(x));
}

export function newPostAttachmentSection(params: any): PostAttachmentSection {
  if (typeof params?.path !== "string") throw new InvalidArgumentError();
  return {
    id: newUUID(),
    type: "attachment",
    path: params.path,
  };
}

export function newPostTextSection(params: any): PostTextSection {
  if (typeof params?.body !== "string") throw new InvalidArgumentError();
  return {
    id: newUUID(),
    type: "text",
    body: params.body,
  };
}

export function newPostSection(params: any): PostSection {
  if (params?.type === "attachment") return newPostAttachmentSection(params);
  if (params?.type === "text") return newPostTextSection(params);
  throw new InvalidArgumentError();
}

export function newPost(currentUser: User, params: any): Post {
  let post: Partial<Post> = newRecord(currentUser);

  if (!isUUID(params.roomId)) throw new InvalidArgumentError();
  post = { ...post, roomId: params.roomId };

  if (!Array.isArray(params.sections) || params.sections.length < 1)
    throw new InvalidArgumentError();
  post = {
    ...post,
    sections: params.sections.map(
      (section: any): PostSection => newPostSection(section),
    ),
  };

  return post as Post;
}

export function serializePostAttachmentSection(
  section: PostAttachmentSection,
): { id: string; type: "attachment"; path: string } {
  return {
    id: section.id,
    type: "attachment",
    path: section.path,
  };
}

export function serializePostTextSection(section: PostTextSection): {
  id: string;
  type: "text";
  body: string;
} {
  return {
    id: section.id,
    type: "text",
    body: section.body,
  };
}

export function serializePostSection(section: PostSection) {
  if (isPostAttachmentSection(section))
    return serializePostAttachmentSection(section);
  if (isPostTextSection(section)) return serializePostTextSection(section);
  throw new InvalidArgumentError();
}

export function serializePost(post: Post) {
  return {
    ...serializeRecord(post),
    ...(post.deletedAt
      ? {}
      : {
          authorId: post.createdBy,
          roomId: post.roomId,
          sections: post.sections.map(serializePostSection),
        }),
  };
}

export async function fetchPosts(
  db: Firestore,
  { createdBefore, roomId }: any,
): Promise<Post[]> {
  let query: CollectionReference<DocumentData> | Query<DocumentData> =
    db.collection("posts");
  if (typeof createdBefore === "string" && createdBefore.match(/\d+/))
    query = query.where(
      "createdAt",
      "<",
      new Timestamp(parseInt(createdBefore), 0),
    );
  if (isUUID(roomId)) query = query.where("roomId", "==", roomId);
  query = query.orderBy("createdAt", "desc").limit(25);

  const results = await query.get();

  return results.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
    };
  }) as Post[];
}

export async function savePost(db: Firestore, post: Post): Promise<void> {
  const { id: postId, ...postData } = post;
  await db.collection("posts").doc(postId).set(postData);
}
