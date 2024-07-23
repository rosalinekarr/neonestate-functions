import { getFirestore } from "firebase-admin/firestore";
import {
  User,
  fetchUser,
  fetchUsers,
  updateUser,
  newUser,
  saveUser,
  serializeUser,
} from "../models/user";
import type { paths } from "../schema";
import { AlreadyExistsError, NotFoundError } from "../models/error";
import { RequestInfo } from "../api";
import { emit } from "../models/event";

export type GetUsersResponse =
  paths["/users"]["get"]["responses"][200]["content"]["application/json"];

export async function getUsers({
  currentUser,
  phoneNumber,
  query,
}: RequestInfo): Promise<GetUsersResponse> {
  const db = getFirestore();
  const users = await fetchUsers(db, query);

  console.log(`Users queried by ${phoneNumber}: ${JSON.stringify(query)}`);
  return users.map((user) => serializeUser(user));
}

export type GetUserResponse =
  paths["/users/{id}"]["get"]["responses"][200]["content"]["application/json"];

export async function getUser({
  currentUser,
  pathParams,
  phoneNumber,
}: RequestInfo): Promise<GetUserResponse> {
  if (typeof pathParams === "undefined") throw new Error("Invalid path params");

  const db = getFirestore();
  const user = await fetchUser(db, pathParams[0]);

  console.log(`User fetched by ${phoneNumber}: ${JSON.stringify(user)}`);
  return serializeUser(user);
}

export type GetProfileResponse =
  paths["/profile"]["get"]["responses"][200]["content"]["application/json"];

export async function getProfile({
  currentUser,
  phoneNumber,
}: RequestInfo): Promise<GetProfileResponse> {
  if (!currentUser) throw new NotFoundError();

  console.log(`Profile fetched by ${phoneNumber}`);
  return serializeUser(currentUser);
}

export type UpdateProfileResponse =
  paths["/profile"]["post"]["responses"][200]["content"]["application/json"];

export async function updateProfile({
  currentUser,
  getBody,
  phoneNumber,
}: RequestInfo): Promise<UpdateProfileResponse> {
  let user: User;
  const isNewUser = !currentUser;
  const body = await getBody();

  if (isNewUser) {
    user = newUser({
      ...body,
      phoneNumber,
    });
  } else {
    user = updateUser(currentUser, body);
  }

  const db = getFirestore();
  const [existingUser] = await fetchUsers(db, { username: user.username });
  if (existingUser && existingUser.id !== user.id) {
    throw new AlreadyExistsError();
  }

  await saveUser(db, user);

  const responseObj = serializeUser(user);
  console.log(
    `Profile updated by ${phoneNumber}: ${JSON.stringify(responseObj)}`,
  );
  emit(isNewUser ? "usercreated" : "userupdated", responseObj);
  return responseObj;
}
