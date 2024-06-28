import { Request, Response } from "express";
import { getFirestore } from "firebase-admin/firestore";
import * as logger from "firebase-functions/logger";
import { HttpsError } from "firebase-functions/v2/https";
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

export type GetUsersParams = paths["/users"]["get"]["parameters"];
export type GetUsersResponse =
  paths["/users"]["get"]["responses"][200]["content"]["application/json"];

export async function getUsers(
  request: GetUsersParams,
  response: Response<GetUsersResponse>,
) {
  const db = getFirestore();
  const users = await fetchUsers(db, request.query);

  logger.info("Users queried", {
    currentUser: response.locals.currentUser,
    query: request.query,
  });
  response.json(users.map((user) => serializeUser(user)));
}

export type GetUserResponse =
  paths["/users/{id}"]["get"]["responses"][200]["content"]["application/json"];

export async function getUser(
  request: Request,
  response: Response<GetUserResponse>,
) {
  const db = getFirestore();
  const user = await fetchUser(db, request.params.id);

  logger.info("User fetched", {
    currentUser: response.locals.currentUser,
    user,
  });
  response.status(200).json(serializeUser(user));
}

export type GetProfileResponse =
  paths["/profile"]["get"]["responses"][200]["content"]["application/json"];

export async function getProfile(
  _request: Request,
  response: Response<GetProfileResponse>,
) {
  if (!response.locals.currentUser) {
    throw new HttpsError("not-found", "Profile not found");
  }

  logger.info("Profile fetched", { currentUser: response.locals.currentUser });
  response.status(200).json(serializeUser(response.locals.currentUser));
}

export type UpdateProfileResponse =
  paths["/profile"]["post"]["responses"][200]["content"]["application/json"];

export async function updateProfile(
  request: Request,
  response: Response<UpdateProfileResponse>,
) {
  const currentUser = response.locals.currentUser;
  const phoneNumber = response.locals.phoneNumber;
  let user: User;

  if (currentUser) {
    user = updateUser(currentUser, request.body);
  } else {
    user = newUser({
      ...request.body,
      phoneNumber,
    });
  }

  const db = getFirestore();
  const [existingUser] = await fetchUsers(db, { username: user.username });
  if (existingUser && existingUser.id !== user.id) {
    throw new HttpsError("already-exists", "Username already taken");
  }

  await saveUser(db, user);

  logger.info("Profile updated", {
    phoneNumber,
    user,
  });
  response.json(serializeUser(user));
}
