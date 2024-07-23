import { ServerHttp2Stream } from "http2";
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
import { User } from "./models/user";

export interface RequestInfo {
  currentUser: User;
  getBody: () => Promise<any>;
  pathParams?: string[];
  phoneNumber: string;
  query?: URLSearchParams;
  stream: ServerHttp2Stream;
}

export interface Route {
  method: string;
  pathMatcher: RegExp;
  handler: (req: RequestInfo) => Promise<any>;
}

const api: Route[] = [
  { method: "get", pathMatcher: /\/events/, handler: listenEvents },
  { method: "get", pathMatcher: /\/events/, handler: listenEvents },
  { method: "get", pathMatcher: /\/posts/, handler: getPosts },
  { method: "post", pathMatcher: /\/posts/, handler: createPost },
  { method: "get", pathMatcher: /\/profile/, handler: getProfile },
  { method: "post", pathMatcher: /\/profile/, handler: updateProfile },
  { method: "get", pathMatcher: /\/rooms/, handler: getRooms },
  {
    method: "get",
    pathMatcher:
      /\/rooms\/([a-z0-9]{8}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{12})$/,
    handler: getRoom,
  },
  { method: "post", pathMatcher: /\/rooms/, handler: createRoom },
  {
    method: "put",
    pathMatcher:
      /\/rooms\/([a-z0-9]{8}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{12})$/,
    handler: updateRoom,
  },
  { method: "get", pathMatcher: /\/users/, handler: getUsers },
  {
    method: "get",
    pathMatcher:
      /\/users\/([a-z0-9]{8}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{12})$/,
    handler: getUser,
  },
];

export default api;
