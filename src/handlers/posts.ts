import { Request, Response } from "express";
import {
  CollectionReference,
  DocumentData,
  Query,
  Timestamp,
  getFirestore,
} from "firebase-admin/firestore";
import * as logger from "firebase-functions/logger";
import { HttpsError } from "firebase-functions/v2/https";

export async function getPosts(request: Request, response: Response) {
  const roomId =
    typeof request.query.roomId === "string" ? request.query.roomId : null;
  const createdBefore =
    typeof request.query.createdBefore === "string"
      ? parseInt(request.query.createdBefore)
      : null;

  const db = getFirestore();
  let query: CollectionReference<DocumentData> | Query<DocumentData> =
    db.collection("posts");
  if (createdBefore)
    query = query.where("createdAt", "<", new Timestamp(createdBefore, 0));
  if (roomId) query = query.where("roomId", "==", roomId);
  query = query.orderBy("createdAt", "desc").limit(25);
  const querySnapshot = await query.get();

  logger.info("Rooms queried", { createdBefore, roomId });
  response.json(
    querySnapshot.docs.map((doc) => {
      const { authorId, sections, createdAt, deletedAt, updatedAt } =
        doc.data();
      if (deletedAt) return { id: doc.id, deletedAt };
      return {
        id: doc.id,
        authorId,
        sections,
        createdAt: createdAt.seconds,
        updatedAt: updatedAt.seconds,
      };
    }),
  );
}

interface PostAttachmentSection {
  id: string;
  type: string;
  path: string;
}

interface PostTextSection {
  id: string;
  type: string;
  body: string;
}

type PostSection = PostAttachmentSection | PostTextSection;

function isPostAttachmentSection(
  section: PostSection,
): section is PostAttachmentSection {
  return section.type === "attachment";
}

function isPostTextSection(section: PostSection): section is PostTextSection {
  return section.type === "text";
}

export async function createPost(request: Request, response: Response) {
  const sections = request.body?.sections;
  const roomId = request.body?.roomId;

  const db = getFirestore();
  const docRef = await db.collection("posts").add({
    authorId: response.locals.uid,
    sections: sections.map((section: PostSection) => {
      if (isPostAttachmentSection(section)) {
        return {
          id: crypto.randomUUID(),
          type: "attachment",
          path: section.path,
        };
      }
      if (isPostTextSection(section)) {
        return {
          id: crypto.randomUUID(),
          type: "text",
          body: section.body,
        };
      }
      throw new HttpsError("unimplemented", "Unsupported post section type");
    }),
    createdAt: Timestamp.now(),
    roomId,
  });
  const doc = await docRef.get();

  logger.info("New post created", { id: doc.id });
  const data = doc.data();
  response.json({
    id: doc.id,
    authorId: response.locals.uid,
    sections: data?.sections,
    createdAt: data?.createdAt?.seconds,
    roomId: data?.roomId,
  });
}
