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
import { InvalidArgumentError, NotFoundError } from "./error";

export type User = Record & {
  avatarPath: string;
  phoneNumber: PhoneNumber;
  username: string;
};

export function serializeUser(user: User) {
  return {
    ...serializeRecord(user),
    ...(user.deletedAt
      ? {}
      : {
          avatarPath: user.avatarPath,
          username: user.username,
        }),
  };
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

  if (typeof avatarPath !== "string") throw new InvalidArgumentError();
  user.avatarPath = avatarPath;

  if (!isPhoneNumber(phoneNumber)) throw new InvalidArgumentError();
  user.phoneNumber = phoneNumber;

  if (
    typeof username !== "string" ||
    !username.match(/^[\p{L}\p{N}\p{P}\p{S}]+$/u)
  )
    throw new InvalidArgumentError();
  user.username = username;

  return user as User;
}

export async function fetchUsers(
  db: Firestore,
  { phoneNumber, username }: any,
): Promise<User[]> {
  let query: CollectionReference<DocumentData> | Query<DocumentData> =
    db.collection("users");

  if (
    typeof username === "string" &&
    username.match(/^[\p{L}\p{N}\p{P}\p{S}]+$/u)
  )
    query = query.where("username", "==", username);

  if (typeof phoneNumber === "string")
    query = query.where("phoneNumber", "==", phoneNumber);

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
  if (!isUUID(id)) throw new InvalidArgumentError();
  const doc = await db.collection("users").doc(id).get();
  if (!doc.exists) throw new NotFoundError();
  const data = doc.data();
  return {
    id: doc.id,
    ...data,
  } as User;
}

export function updateUser(
  originalUser: User,
  { avatarPath, username }: any,
): User {
  let user = { ...originalUser };
  if (avatarPath) user.avatarPath = avatarPath;
  if (username) user.username = username;
  return user;
}

export async function saveUser(db: Firestore, user: User): Promise<void> {
  const { id: userId, ...userData } = user;
  await db.collection("users").doc(userId).set(userData);
}
