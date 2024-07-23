import { getFirestore } from "firebase-admin/firestore";
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
import { AlreadyExistsError, PermissionDeniedError } from "../models/error";
import { RequestInfo } from "../api";

export type GetRoomsResponse =
  paths["/rooms"]["get"]["responses"][200]["content"]["application/json"];

export async function getRooms({
  currentUser,
  phoneNumber,
  query,
}: RequestInfo): Promise<GetRoomsResponse> {
  const db = getFirestore();
  const rooms = await fetchRooms(db, query);

  console.log(`Rooms queried by ${phoneNumber}: ${JSON.stringify(query)}`);
  return rooms.map((room) => serializeRoom(room, currentUser));
}

export type GetRoomResponse =
  paths["/rooms/{id}"]["get"]["responses"][200]["content"]["application/json"];

export async function getRoom({
  currentUser,
  pathParams,
  phoneNumber,
}: RequestInfo): Promise<GetRoomResponse> {
  if (typeof pathParams === "undefined") throw new Error("Invalid path params");

  const db = getFirestore();
  const room = await fetchRoom(db, pathParams[0]);

  console.log(`Rooms fetched by ${phoneNumber}: ${JSON.stringify(room)}`);
  return serializeRoom(room, currentUser);
}

export type CreateRoomResponse =
  paths["/rooms"]["post"]["responses"][200]["content"]["application/json"];

export async function createRoom({
  currentUser,
  getBody,
  phoneNumber,
}: RequestInfo): Promise<CreateRoomResponse> {
  const body = await getBody();
  let room = newRoom(currentUser, body);

  const db = getFirestore();
  const [existingRoom] = await fetchRooms(db, { name: room.name });
  if (existingRoom) {
    throw new AlreadyExistsError();
  }

  room = grantInitialPermissions(room, currentUser);

  await saveRoom(db, room);

  console.log(`New room created by ${phoneNumber}: ${JSON.stringify(room)}`);
  return serializeRoom(room, currentUser);
}

export type UpdateRoomResponse =
  paths["/rooms/{id}"]["put"]["responses"][200]["content"]["application/json"];

export async function updateRoom({
  currentUser,
  getBody,
  pathParams,
  phoneNumber,
}: RequestInfo): Promise<UpdateRoomResponse> {
  if (typeof pathParams === "undefined") throw new Error("Invalid path params");

  const db = getFirestore();
  const room = await fetchRoom(db, pathParams[0]);

  if (!hasPermissionToEditRoom(currentUser, room))
    throw new PermissionDeniedError();

  const body = await getBody();

  if (typeof body.backgroundPath === "string")
    room.backgroundPath = body.backgroundPath;

  if (typeof body.description === "string") room.description = body.description;

  await saveRoom(db, room);

  console.log(`Room updated by ${phoneNumber}: ${JSON.stringify(room)}`);
  return serializeRoom(room, currentUser);
}
