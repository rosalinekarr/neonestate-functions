import { Request, Response } from "express";
import { getFirestore } from "firebase-admin/firestore";
import * as logger from "firebase-functions/logger";
import { HttpsError } from "firebase-functions/v2/https";
import {
  fetchRoom,
  fetchRooms,
  newRoom,
  saveRoom,
  serializeRoom,
} from "../models/room";

export async function getRooms(request: Request, response: Response) {
  const db = getFirestore();
  const rooms = await fetchRooms(db, request.params);

  logger.info("Rooms queried", {
    currentUser: response.locals.currentUser,
    query: request.params,
  });
  response.json(rooms.map((room) => serializeRoom(room)));
}

export async function getRoom(request: Request, response: Response) {
  const db = getFirestore();
  const room = await fetchRoom(db, request.params.id);

  logger.info("Room fetched", {
    currentUser: response.locals.currentUser,
    room,
  });
  response.status(200).json(serializeRoom(room));
}

export async function createRoom(request: Request, response: Response) {
  const room = newRoom(response.locals.currentUser, request.body);

  const db = getFirestore();
  const [existingRoom] = await fetchRooms(db, { name: room.name });
  if (existingRoom) {
    throw new HttpsError("already-exists", "Room name already taken");
  }

  await saveRoom(db, room);

  logger.info("New room created", {
    currentUser: response.locals.currentUser,
    room,
  });
  response.json(serializeRoom(room));
}

export async function updateRoom(request: Request, response: Response) {
  const db = getFirestore();
  const room = await fetchRoom(db, request.params.id);

  if (typeof request.body.backgroundPath === "string")
    room.backgroundPath = request.body.backgroundPath;

  if (typeof request.body.description === "string")
    room.description = request.body.description;

  await saveRoom(db, room);

  logger.info("Room updated", {
    phoneNumber: response.locals.currentUser,
    room,
  });
  response.json(serializeRoom(room));
}
