import { Request, Response } from "express";
import {
  DocumentData,
  Query,
  Timestamp,
  getFirestore,
} from "firebase-admin/firestore";
import * as logger from "firebase-functions/logger";
import { HttpsError } from "firebase-functions/v2/https";

export async function getRooms(request: Request, response: Response) {
  const name = request.query.name;
  const sort = request.query.sort;

  if (
    name &&
    (typeof name !== "string" || !name.match(/^[\p{L}\p{N}\p{P}\p{S}]+$/u))
  ) {
    throw new HttpsError("invalid-argument", "Invalid room name");
  }

  if (sort && sort !== "member_count_desc") {
    throw new HttpsError("invalid-argument", "Invalid sort option");
  }

  const db = getFirestore();
  let query: Query<DocumentData> = db.collection("rooms");
  if (name) query = query.where("name", "==", name);
  if (sort === "member_count_desc")
    query = query.orderBy("memberCount", "desc");
  const querySnapshot = await query.get();

  logger.info("Rooms queried", { name, sort });
  response.json(
    querySnapshot.docs.map((doc) => {
      const { backgroundPath, createdAt, createdBy, description, name } =
        doc.data();
      return {
        id: doc.id,
        backgroundPath,
        description,
        createdAt: createdAt.seconds,
        createdBy,
        name,
      };
    }),
  );
}

export async function getRoom(request: Request, response: Response) {
  const id = request.params.id;
  const db = getFirestore();
  const docSnapshot = await db.doc(`rooms/${id}`).get();

  if (!docSnapshot.exists) {
    throw new HttpsError("not-found", "Room not found");
  }

  logger.info("Room fetched", { id });
  const data = docSnapshot.data();
  response.status(200).json({
    id: docSnapshot.id,
    backgroundPath: data?.backgroundPath,
    createdAt: data?.createdAt?.seconds,
    createdBy: data?.createdBy,
    description: data?.description,
    name: data?.name,
  });
}

export async function createRoom(request: Request, response: Response) {
  const roomName = request.body?.name;

  if (
    typeof roomName !== "string" ||
    !roomName.match(/^[\p{L}\p{N}\p{P}\p{S}]+$/u)
  ) {
    throw new HttpsError("invalid-argument", "Invalid room name");
  }

  const db = getFirestore();
  const querySnapshot = await db
    .collection("rooms")
    .where("name", "==", roomName)
    .get();

  if (!querySnapshot.empty) {
    throw new HttpsError("already-exists", "Room name already taken");
  }

  const docRef = await db.collection("rooms").add({
    ...(request.body?.backgroundPath
      ? { backgroundPath: request.body?.backgroundPath }
      : {}),
    createdAt: Timestamp.now(),
    createdBy: response.locals.uid,
    description: request.body?.description || "",
    memberCount: 1,
    name: roomName,
  });
  const doc = await docRef.get();

  logger.info("New room created", { roomName });
  const data = doc.data();
  response.json({
    id: doc.id,
    backgroundPath: data?.backgroundPath,
    createdAt: data?.createdAt?.seconds,
    createdBy: data?.createdBy,
    description: data?.description,
    name: data?.name,
  });
}

export async function updateRoom(request: Request, response: Response) {
  const id = request.params.id;
  const db = getFirestore();
  const docRef = db.doc(`rooms/${id}`);
  const docSnapshot = await docRef.get();

  if (!docSnapshot.exists) {
    throw new HttpsError("not-found", "Room not found");
  }

  const backgroundPath = request.body?.backgroundPath;
  const description = request.body?.description;

  logger.info("Room fetched", { id });
  const updatedRoom = {
    ...docSnapshot.data(),
    ...(backgroundPath ? { backgroundPath } : {}),
    ...(description ? { description } : {}),
  };

  await docRef.set(updatedRoom);

  logger.info("Room updated", { id });
  response.json({
    id: docSnapshot.id,
    ...updatedRoom,
  });
}
