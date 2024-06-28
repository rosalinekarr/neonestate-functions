import { Request, Response } from "express";
import * as logger from "firebase-functions/logger";
import { Timestamp, getFirestore } from "firebase-admin/firestore";
import { HttpsError } from "firebase-functions/v2/https";
import { User, serializeUser } from "../models/user";
import { Post, serializePost } from "../models/post";
import type { paths } from "../schema";

export type ListenEventsResponse = paths["/events"]["get"]["responses"][200];

export async function listenEvents(
  request: Request,
  response: Response<ListenEventsResponse>,
) {
  response.writeHead(200, {
    "Cache-Control": "no-cache",
    "Content-Type": "text/event-stream",
    Connection: "keep-alive",
    "Keep-Alive": "timeout=3600, max=24",
  });
  response.flushHeaders();

  const db = getFirestore();

  const lastTsRaw = request.query.lastTs;
  if (typeof lastTsRaw !== "string" || !lastTsRaw?.match(/\d+/))
    throw new HttpsError("invalid-argument", "Invalid lastTs");
  const lastTs = parseInt(lastTsRaw);

  logger.info("Subscribing listener", {
    phoneNumber: response.locals.phoneNumber,
  });

  const postsQuery = db
    .collection("posts")
    .where("updatedAt", ">=", new Timestamp(lastTs, 0));

  const unsubscribePosts = postsQuery.onSnapshot(
    (querySnapshot) =>
      querySnapshot.forEach((doc) => {
        const postData = doc.data();
        const post = serializePost({
          id: doc.id,
          ...postData,
        } as Post);
        if (post.deletedAt) {
          logger.info("Sending event", { name: "postdeleted", data: post });
          response.write(
            `event: postdeleted\ndata: ${JSON.stringify(post)}\n\n`,
          );
        } else if (post.createdAt === post.updatedAt) {
          logger.info("Sending event", { name: "postcreated", data: post });
          response.write(
            `event: postcreated\ndata: ${JSON.stringify(post)}\n\n`,
          );
        } else {
          logger.info("Sending event", { name: "postupdated", data: post });
          response.write(
            `event: postupdated\ndata: ${JSON.stringify(post)}\n\n`,
          );
        }
      }),
    (error: Error) => {
      logger.error("Error listening for post events", { error });
      response.end();
    },
  );

  const usersQuery = db
    .collection("users")
    .where("updatedAt", ">=", new Timestamp(lastTs, 0));

  const unsubscribeUsers = usersQuery.onSnapshot(
    (querySnapshot) =>
      querySnapshot.forEach((doc) => {
        const userData = doc.data();
        const user = serializeUser({
          id: doc.id,
          ...userData,
        } as User);
        if (user.deletedAt) {
          logger.info("Sending event", { name: "userdeleted", data: user });
          response.write(
            `event: userdeleted\ndata: ${JSON.stringify(user)}\n\n`,
          );
        } else if (user.createdAt === user.updatedAt) {
          logger.info("Sending event", { name: "usercreated", data: user });
          response.write(
            `event: usercreated\ndata: ${JSON.stringify(user)}\n\n`,
          );
        } else {
          logger.info("Sending event", { name: "userupdated", data: user });
          response.write(
            `event: userupdated\ndata: ${JSON.stringify(user)}\n\n`,
          );
        }
      }),
    (error: Error) => {
      logger.error("Error listening for user events", { error });
      response.end();
    },
  );

  logger.info("Listener subscribed", {
    phoneNumber: response.locals.phoneNumber,
  });

  response.on("close", () => {
    unsubscribePosts();
    unsubscribeUsers();

    logger.info("Listener unsubscribed");
    response.end();
  });
}
