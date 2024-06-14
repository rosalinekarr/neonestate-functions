import { Request, Response } from "express";
import { Timestamp, getFirestore } from "firebase-admin/firestore";
import * as logger from "firebase-functions/logger";
import { HttpsError } from "firebase-functions/v2/https";

export async function getUsers(request: Request, response: Response) {
  const username = request.query.username;

  if (
    typeof username !== "string" ||
    !username.match(/^[\p{L}\p{N}\p{P}\p{S}]+$/u)
  ) {
    throw new HttpsError("invalid-argument", "Invalid username");
  }

  const db = getFirestore();
  const querySnapshot = await db
    .collection("users")
    .where("username", "==", username)
    .get();

  logger.info("Users queried", { name });
  response.json(
    querySnapshot.docs.map((doc) => {
      const { avatarPath, createdAt, username } = doc.data();
      return {
        id: doc.id,
        avatarPath,
        username,
        createdAt: createdAt.seconds,
      };
    }),
  );
}

export async function getUser(request: Request, response: Response) {
  const id = request.params.id;
  const db = getFirestore();
  const docSnapshot = await db.doc(`users/${id}`).get();

  if (!docSnapshot.exists) {
    throw new HttpsError("not-found", "User not found");
  }

  logger.info("User fetched", { id });
  const data = docSnapshot.data();
  response.status(200).json({
    id: docSnapshot.id,
    avatarPath: data?.avatarPath,
    username: data?.username,
    createdAt: data?.createdAt?.seconds,
  });
}

export async function createUser(request: Request, response: Response) {
  const uid = response.locals.uid;
  const avatarPath = request.body?.avatarPath;
  const username = request.body?.username;

  if (
    typeof username !== "string" ||
    !username.match(/^[\p{L}\p{N}\p{P}\p{S}]+$/u)
  ) {
    throw new HttpsError("invalid-argument", "Invalid username");
  }

  const db = getFirestore();
  const querySnapshot = await db
    .collection("users")
    .where("username", "==", username)
    .get();

  if (!querySnapshot.empty) {
    throw new HttpsError("already-exists", "Username already taken");
  }

  await db.doc(`users/${uid}`).set({
    avatarPath,
    createdAt: Timestamp.now(),
    username,
  });
  const doc = await db.doc(`users/${uid}`).get();

  logger.info("New user registered", { username });
  const data = doc.data();
  response.json({
    id: doc.id,
    avatarPath: data?.avatarPath,
    username: data?.username,
    createdAt: data?.createdAt?.seconds,
  });
}
