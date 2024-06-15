import { Request, Response } from "express";
import * as logger from "firebase-functions/logger";
import { Timestamp, getFirestore } from "firebase-admin/firestore";
import { HttpsError } from "firebase-functions/v2/https";

export async function listenEvents(request: Request, response: Response) {
  const db = getFirestore();

  const lastTsRaw = request.query.lastTs;
  if (typeof lastTsRaw !== "string" || !lastTsRaw?.match(/\d+/))
    throw new HttpsError("invalid-argument", "Invalid lastTs");
  const lastTs = parseInt(lastTsRaw);

  response.set({
    "Access-Control-Allow-Credentials": "true",
    "Cache-Control": "no-cache",
    "Content-Type": "text/event-stream",
    Connection: "keep-alive",
  });
  response.send();

  logger.info("Subscribing listener", { uid: response.locals.uid });

  const unsubscribePosts = db
    .collection("posts")
    .where("updatedAt", ">=", Timestamp.fromMillis(lastTs * 1000))
    .onSnapshot((querySnapshot) =>
      querySnapshot.forEach(
        (docSnapshot) => {
          const post = docSnapshot.data();
          if (post.deletedAt) {
            const msg = { id: post.id, deletedAt: post.deletedAt };
            logger.info("Sending event", { name: "postdeleted", data: msg });
            response.send(
              `event: postdeleted\ndata: ${JSON.stringify(msg)}\n\n`,
            );
          } else if (post.createdAt === post.updatedAt) {
            logger.info("Sending event", { name: "postcreated", data: post });
            response.send(
              `event: postcreated\ndata: ${JSON.stringify(post)}\n\n`,
            );
          } else {
            logger.info("Sending event", { name: "postupdated", data: post });
            response.send(
              `event: postupdated\ndata: ${JSON.stringify(post)}\n\n`,
            );
          }
        },
        (error: Error) => {
          logger.error("Error listening for post events", { error });
          response.end();
        },
      ),
    );

  const unsubscribeUsers = db
    .collection("users")
    .where("updatedAt", ">=", Timestamp.fromMillis(lastTs * 1000))
    .onSnapshot(
      (querySnapshot) => {
        querySnapshot.forEach((docSnapshot) => {
          const user = docSnapshot.data();
          if (user.deletedAt) {
            logger.info("Sending event", { name: "userdeleted", data: user });
            response.send(
              `event: userdeleted\ndata: ${JSON.stringify(user)}\n\n`,
            );
          } else if (user.updatedAt === user.createdAt) {
            logger.info("Sending event", { name: "usercreated", data: user });
            response.send(
              `event: usercreated\ndata: ${JSON.stringify(user)}\n\n`,
            );
          } else {
            logger.info("Sending event", { name: "userupdated", data: user });
            response.send(
              `event: userupdated\ndata: ${JSON.stringify(user)}\n\n`,
            );
          }
        });
      },
      (error: Error) => {
        logger.error("Error listening for user events", { error });
        response.end();
      },
    );

  logger.info("Listener subscribed", { uid: response.locals.uid });

  response.on("close", () => {
    unsubscribePosts();
    unsubscribeUsers();
    response.end();
  });
}
