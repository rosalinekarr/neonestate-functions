import { HttpsError } from "firebase-functions/v2/https";
import { PhoneNumber, isPhoneNumber } from "./phoneNumber";
import { Record, serializeRecord } from "./record";
import {
  CollectionReference,
  DocumentData,
  Firestore,
  Query,
  Timestamp,
} from "firebase-admin/firestore";
import { isUUID, newUUID } from "./uuid";

export type User = Record & {
  avatarPath: string;
  phoneNumber: PhoneNumber;
  username: string;
};

export function serializeUser(user: User) {
  const { phoneNumber: _, ...censoredUser } = user;
  return serializeRecord(censoredUser);
}

export function newUser({ id, avatarPath, phoneNumber, username }: any): User {
  const userId = id || newUUID();
  const user: Partial<User> = {
    id: userId,
    createdAt: Timestamp.now(),
    createdBy: userId,
    updatedAt: Timestamp.now(),
    updatedBy: userId,
  };

  if (typeof avatarPath !== "string")
    throw new HttpsError("invalid-argument", "Invalid avatarPath field");
  user.avatarPath = avatarPath;

  if (!isPhoneNumber(phoneNumber))
    throw new HttpsError("invalid-argument", "Invalid phone number field");
  user.phoneNumber = phoneNumber;

  if (
    typeof username !== "string" ||
    !username.match(/^[\p{L}\p{N}\p{P}\p{S}]+$/u)
  )
    throw new HttpsError("invalid-argument", "Invalid username format");
  user.username = username;

  return user as User;
}

export async function fetchUsers(
  db: Firestore,
  { username }: any,
): Promise<User[]> {
  let query: CollectionReference<DocumentData> | Query<DocumentData> =
    db.collection("users");

  if (
    typeof username === "string" &&
    username.match(/^[\p{L}\p{N}\p{P}\p{S}]+$/u)
  )
    query = query.where("username", "==", username);

  const results = await query.get();

  return results.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
    };
  }) as User[];
}

export async function fetchUser(db: Firestore, id: any): Promise<User> {
  if (!isUUID(id)) throw new HttpsError("invalid-argument", "Invalid user id");
  const doc = await db.collection("users").doc(id).get();
  if (!doc.exists) throw new HttpsError("not-found", "User not found");
  const data = doc.data();
  return {
    id: doc.id,
    ...data,
  } as User;
}

export async function saveUser(db: Firestore, user: User): Promise<void> {
  const { id: userId, ...userData } = user;
  await db.collection("users").doc(userId).set(userData);
}
