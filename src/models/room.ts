import { HttpsError } from "firebase-functions/v2/https";
import { Record, newRecord, serializeRecord } from "./record";
import { isUUID } from "./uuid";
import {
  CollectionReference,
  DocumentData,
  Firestore,
  Query,
} from "firebase-admin/firestore";
import { User } from "./user";

export type Room = Record & {
  backgroundPath: string;
  description: string;
  name: string;
};

export function newRoom(
  currentUser: User,
  { backgroundPath, description, name }: any,
): Room {
  let room: Partial<Room> = newRecord(currentUser);

  if (typeof backgroundPath === "string") room.backgroundPath = backgroundPath;
  else if (backgroundPath !== undefined) {
    throw new HttpsError("invalid-argument", "Invalid room backgroundPath");
  }

  if (typeof description !== "string")
    throw new HttpsError("invalid-argument", "Invalid room description");
  room.description = description;

  if (typeof name !== "string" || !name.match(/^[\p{L}\p{N}\p{P}\p{S}]+$/u))
    throw new HttpsError("invalid-argument", "Invalid room name");
  room.name = name;

  return room as Room;
}

export async function saveRoom(db: Firestore, room: Room): Promise<void> {
  const { id: roomId, ...roomData } = room;
  await db.collection("rooms").doc(roomId).set(roomData);
}

export async function fetchRooms(db: Firestore, params: any): Promise<Room[]> {
  let query: CollectionReference<DocumentData> | Query<DocumentData> =
    db.collection("rooms");
  if (typeof params.name === "string")
    query = query.where("name", "==", params.name);
  if (params.sort === "members_count_desc")
    query = query.orderBy("membersCount", "desc");

  const results = await query.get();

  return results.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
    };
  }) as Room[];
}

export async function fetchRoom(db: Firestore, id: any): Promise<Room> {
  if (!isUUID(id)) throw new HttpsError("invalid-argument", "Invalid room id");
  const doc = await db.collection("rooms").doc(id).get();
  if (!doc.exists) throw new HttpsError("not-found", "Room not found");
  const data = doc.data();
  return {
    id: doc.id,
    ...data,
  } as Room;
}

export function serializeRoom(room: Room) {
  return serializeRecord(room);
}
