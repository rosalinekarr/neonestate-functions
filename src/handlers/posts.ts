import { getFirestore } from "firebase-admin/firestore";
import {
  Post,
  fetchPosts,
  newPost,
  savePost,
  serializePost,
} from "../models/post";
import type { paths } from "../schema";
import { RequestInfo } from "../api";
import { emit } from "../models/event";

export type GetPostsResponse =
  paths["/posts"]["get"]["responses"][200]["content"]["application/json"];

export async function getPosts({ phoneNumber, query }: RequestInfo) {
  const db = getFirestore();
  const posts = await fetchPosts(db, query);

  console.log(`Posts queried by ${phoneNumber}: ${JSON.stringify(query)}`);
  return posts.map((post: Post) => serializePost(post));
}

export type CreatePostsResponse =
  paths["/posts"]["post"]["responses"][200]["content"]["application/json"];

export async function createPost({
  currentUser,
  getBody,
  phoneNumber,
}: RequestInfo): Promise<CreatePostsResponse> {
  const db = getFirestore();
  const body = await getBody();
  const post = newPost(currentUser, body);

  await savePost(db, post);

  const responseObj = serializePost(post);
  console.log(
    `Posts queried by ${phoneNumber}: ${JSON.stringify(responseObj)}`,
  );
  emit("postcreated", responseObj);
  return responseObj;
}
