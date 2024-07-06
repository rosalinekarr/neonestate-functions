import { Request, Response } from "express";
import { getFirestore } from "firebase-admin/firestore";
import * as logger from "firebase-functions/logger";
import { HttpsError } from "firebase-functions/v2/https";
import {
  grantInitialPermissions,
  hasPermissionToEditRoom,
} from "../models/permission";
import {
  fetchRoom,
  fetchRooms,
  newRoom,
  saveRoom,
  serializeRoom,
} from "../models/room";
import type { paths } from "../schema";

export type GetRoomsResponse =
  paths["/rooms"]["get"]["responses"][200]["content"]["application/json"];

export async function getRooms(
  request: Request,
  response: Response<GetRoomsResponse>,
) {
  const db = getFirestore();
  const rooms = await fetchRooms(db, request.query);

  logger.info("Rooms queried", {
    currentUser: response.locals.currentUser,
    query: request.query,
  });
  response.json(
    rooms.map((room) => serializeRoom(room, response.locals.currentUser)),
  );
}

export type GetRoomResponse =
  paths["/rooms/{id}"]["get"]["responses"][200]["content"]["application/json"];

export async function getRoom(
  request: Request,
  response: Response<GetRoomResponse>,
) {
  const db = getFirestore();
  const room = await fetchRoom(db, request.params.id);

  logger.info("Room fetched", {
    currentUser: response.locals.currentUser,
    room,
  });
  response.status(200).json(serializeRoom(room, response.locals.currentUser));
}

export type CreateRoomResponse =
  paths["/rooms"]["post"]["responses"][200]["content"]["application/json"];

export async function createRoom(
  request: Request,
  response: Response<CreateRoomResponse>,
) {
  let room = newRoom(response.locals.currentUser, request.body);

  const db = getFirestore();
  const [existingRoom] = await fetchRooms(db, { name: room.name });
  if (existingRoom) {
    throw new HttpsError("already-exists", "Room name already taken");
  }

  room = grantInitialPermissions(room, response.locals.currentUser);

  await saveRoom(db, room);

  logger.info("New room created", {
    currentUser: response.locals.currentUser,
    room,
  });
  response.json(serializeRoom(room, response.locals.currentUser));
}

export type UpdateRoomResponse =
  paths["/rooms/{id}"]["put"]["responses"][200]["content"]["application/json"];

export async function updateRoom(
  request: Request,
  response: Response<UpdateRoomResponse>,
) {
  console.log("REQUEST", request);
  const db = getFirestore();
  const room = await fetchRoom(db, request.params.id);

  if (!hasPermissionToEditRoom(response.locals.currentUser, room))
    throw new HttpsError(
      "permission-denied",
      "User does not have permissions for this action",
    );

  if (typeof request.body.backgroundPath === "string")
    room.backgroundPath = request.body.backgroundPath;

  if (typeof request.body.description === "string")
    room.description = request.body.description;

  await saveRoom(db, room);

  logger.info("Room updated", {
    phoneNumber: response.locals.currentUser,
    room,
  });
  response.json(serializeRoom(room, response.locals.currentUser));
}
