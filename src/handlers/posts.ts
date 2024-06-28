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
import type { paths } from "../schema";

export type GetPostsParams = paths["/posts"]["get"]["parameters"];
export type GetPostsResponse =
  paths["/posts"]["get"]["responses"][200]["content"]["application/json"];

export async function getPosts(
  request: GetPostsParams,
  response: Response<GetPostsResponse>,
) {
  const db = getFirestore();
  const posts = await fetchPosts(db, request.query);

  logger.info("Posts queried", {
    currentUser: response.locals.currentUser,
    query: request.query,
  });
  response.json(posts.map((post: Post) => serializePost(post)));
}

export type CreatePostsResponse =
  paths["/posts"]["post"]["responses"][200]["content"]["application/json"];

export async function createPost(
  request: Request,
  response: Response<CreatePostsResponse>,
) {
  const db = getFirestore();
  const post = newPost(response.locals.currentUser, request.body);

  await savePost(db, post);

  logger.info("New post created", {
    currentUser: response.locals.currentUser,
    post: post,
  });
  response.json(serializePost(post));
}
