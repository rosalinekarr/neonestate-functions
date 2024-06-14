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
  updateRoom,
} from "./handlers";

const api = express();

api.use(express.json());

api.use(async (request: Request, response: Response, next) => {
  const authToken = (request.headers.authorization || "").match(
    /Bearer (.+)/,
  )?.[1];
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

api.get("/api/posts", handleAsyncErrors(getPosts));
api.post("/api/posts", handleAsyncErrors(createPost));

api.get("/api/rooms", handleAsyncErrors(getRooms));
api.get("/api/rooms/:id", handleAsyncErrors(getRoom));
api.post("/api/rooms", handleAsyncErrors(createRoom));
api.put("/api/rooms/:id", handleAsyncErrors(updateRoom));

api.get("/api/users", handleAsyncErrors(getUsers));
api.get("/api/users/:id", handleAsyncErrors(getUser));
api.post("/api/users", handleAsyncErrors(createUser));

export default api;
