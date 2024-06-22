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

export async function getUsers(request: Request, response: Response) {
  const db = getFirestore();
  const users = await fetchUsers(db, request.params);

  logger.info("Users queried", {
    currentUser: response.locals.currentUser,
    query: request.params,
  });
  response.json(users.map((user) => serializeUser(user)));
}

export async function getUser(request: Request, response: Response) {
  const db = getFirestore();
  const user = await fetchUser(db, request.params.id);

  logger.info("User fetched", {
    currentUser: response.locals.currentUser,
    user,
  });
  response.status(200).json(serializeUser(user));
}

export async function getProfile(_request: Request, response: Response) {
  if (!response.locals.currentUser) {
    throw new HttpsError("not-found", "Profile not found");
  }

  logger.info("Profile fetched", { currentUser: response.locals.currentUser });
  response.status(200).json(serializeUser(response.locals.currentUser));
}

export async function updateProfile(request: Request, response: Response) {
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
