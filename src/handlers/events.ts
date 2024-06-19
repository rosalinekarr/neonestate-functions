import { Request, Response } from "express";
import * as logger from "firebase-functions/logger";
import { Timestamp, getFirestore } from "firebase-admin/firestore";
import { HttpsError } from "firebase-functions/v2/https";

export async function listenEvents(request: Request, response: Response) {
  response.writeHead(200, {
    "Cache-Control": "no-cache",
    "Content-Type": "text/event-stream",
    Connection: "keep-alive",
    "Keep-Alive": "timeout=3600, max=24",
  });

  const db = getFirestore();

  const lastTsRaw = request.query.lastTs;
  if (typeof lastTsRaw !== "string" || !lastTsRaw?.match(/\d+/))
    throw new HttpsError("invalid-argument", "Invalid lastTs");
  const lastTs = parseInt(lastTsRaw);

  logger.info("Subscribing listener", { uid: response.locals.uid });

  const postsQuery = db
    .collection("posts")
    .where("updatedAt", ">=", new Timestamp(lastTs, 0));

  const unsubscribePosts = postsQuery.onSnapshot(
    (querySnapshot) =>
      querySnapshot.forEach((docSnapshot) => {
        const rawPost = docSnapshot.data();
        const post = {
          ...rawPost,
          id: docSnapshot.id,
          createdAt: rawPost?.createdAt?.seconds,
          updatedAt: rawPost?.updatedAt?.seconds,
          deletedAt: rawPost?.deletedAt?.seconds,
        };
        if (post.deletedAt) {
          const msg = { id: post.id, deletedAt: post.deletedAt };
          logger.info("Sending event", { name: "postdeleted", data: msg });
          response.write(
            `event: postdeleted\ndata: ${JSON.stringify(msg)}\n\n`,
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
      querySnapshot.forEach((docSnapshot) => {
        const rawUserData = docSnapshot.data();
        const user = {
          ...rawUserData,
          id: docSnapshot.id,
          createdAt: rawUserData?.createdAt?.seconds,
          updatedAt: rawUserData?.updatedAt?.seconds,
          deletedAt: rawUserData?.deletedAt?.seconds,
        };
        if (user.deletedAt) {
          const msg = { id: user.id, deletedAt: user.deletedAt };
          logger.info("Sending event", { name: "userdeleted", data: msg });
          response.write(
            `event: userdeleted\ndata: ${JSON.stringify(msg)}\n\n`,
          );
        } else if (user.updatedAt === user.createdAt) {
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

  logger.info("Listener subscribed", { uid: response.locals.uid });

  response.on("close", () => {
    unsubscribePosts();
    unsubscribeUsers();

    logger.info("Listener unsubscribed");
    response.end();
  });
}
