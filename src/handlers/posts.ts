import { Request, Response } from "express";
import { getFirestore } from "firebase-admin/firestore";
import * as logger from "firebase-functions/logger";
import {
  Post,
  fetchPosts,
  newPost,
  savePost,
  serializePost,
} from "../models/post";

export async function getPosts(request: Request, response: Response) {
  const db = getFirestore();
  const posts = await fetchPosts(db, request.params);

  logger.info("Posts queried", {
    currentUser: response.locals.currentUser,
    query: request.params,
  });
  response.json(posts.map((post: Post) => serializePost(post)));
}

export async function createPost(request: Request, response: Response) {
  const db = getFirestore();
  const post = newPost(response.locals.currentUser, request.body);

  await savePost(db, post);

  logger.info("New post created", {
    currentUser: response.locals.currentUser,
    post: post,
  });
  response.json(serializePost(post));
}
