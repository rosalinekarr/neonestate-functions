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
import type { paths } from "../schema";

export type GetRoomsParams = paths["/rooms"]["get"]["parameters"];
export type GetRoomsResponse =
  paths["/rooms"]["get"]["responses"][200]["content"]["application/json"];

export async function getRooms(
  request: GetRoomsParams,
  response: Response<GetRoomsResponse>,
) {
  const db = getFirestore();
  const rooms = await fetchRooms(db, request.query);

  logger.info("Rooms queried", {
    currentUser: response.locals.currentUser,
    query: request.query,
  });
  response.json(rooms.map((room) => serializeRoom(room)));
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
  response.status(200).json(serializeRoom(room));
}

export type CreateRoomResponse =
  paths["/rooms"]["post"]["responses"][200]["content"]["application/json"];

export async function createRoom(
  request: Request,
  response: Response<CreateRoomResponse>,
) {
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

export type UpdateRoomResponse =
  paths["/rooms/{id}"]["put"]["responses"][200]["content"]["application/json"];

export async function updateRoom(
  request: Request,
  response: Response<UpdateRoomResponse>,
) {
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
