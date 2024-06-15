import * as express from "express";
import { Request, Response, NextFunction } from "express";
import { getAuth } from "firebase-admin/auth";
import {
  createPost,
  createRoom,
  createUser,
  getPosts,
  getRooms,
  getRoom,
  getUsers,
  getUser,
  listenEvents,
  updateRoom,
} from "./handlers";

const api = express();

api.use(express.json());

api.use(async (request: Request, response: Response, next) => {
  const paramToken = request.query.token;
  const headerToken = (request.headers.authorization || "").match(
    /Bearer (.+)/,
  )?.[1];
  const authToken = typeof paramToken === "string" ? paramToken : headerToken;
  const { uid } = await getAuth().verifyIdToken(authToken || "");
  response.locals.uid = uid;
  next();
});

function handleAsyncErrors(
  handler: (req: Request, res: Response) => Promise<void>,
) {
  return (req: Request, res: Response, next: NextFunction) => {
    handler(req, res).catch((err) => {
      if (err.code === "not-found") {
        res.status(404).send({ error: err.message });
      } else if (err.code === "already-exists") {
        res.status(409).send({ error: err.message });
      } else if (err.code === "invalid-argument") {
        res.status(422).send({ error: err.message });
      } else {
        res.status(500).send({ error: err.message });
      }
      next(err);
    });
  };
}

api.get("/events", listenEvents);

api.get("/posts", handleAsyncErrors(getPosts));
api.post("/posts", handleAsyncErrors(createPost));

api.get("/rooms", handleAsyncErrors(getRooms));
api.get("/rooms/:id", handleAsyncErrors(getRoom));
api.post("/rooms", handleAsyncErrors(createRoom));
api.put("/rooms/:id", handleAsyncErrors(updateRoom));

api.get("/users", handleAsyncErrors(getUsers));
api.get("/users/:id", handleAsyncErrors(getUser));
api.post("/users", handleAsyncErrors(createUser));

export default api;
