import * as express from "express";
import { Request, Response, NextFunction } from "express";
import { getAuth } from "firebase-admin/auth";
import {
  createPost,
  createRoom,
  getPosts,
  getProfile,
  getRooms,
  getRoom,
  getUsers,
  getUser,
  listenEvents,
  updateProfile,
  updateRoom,
} from "./handlers";
import { HttpsError } from "firebase-functions/v2/https";
import { getFirestore } from "firebase-admin/firestore";
import { fetchUsers } from "./models/user";

const api = express();

api.use(express.json());

function grabAuthToken(request: Request) {
  const headerToken = (request.headers.authorization || "").match(
    /Bearer (.+)/,
  )?.[1];
  if (headerToken) return headerToken;
  const paramToken = request.query.token;
  if (typeof paramToken === "string") return paramToken;
  throw new HttpsError("permission-denied", "Invalid authorization token");
}

api.use(async (request: Request, response: Response, next) => {
  const authToken = grabAuthToken(request);
  const { phone_number: phoneNumber } =
    await getAuth().verifyIdToken(authToken);
  const db = getFirestore();
  const [currentUser] = await fetchUsers(db, { phoneNumber });
  response.locals.currentUser = {
    ...currentUser,
    phoneNumber,
  };
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
api.get("/profile", handleAsyncErrors(getProfile));
api.post("/profile", handleAsyncErrors(updateProfile));

export default api;
