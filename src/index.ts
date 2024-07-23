import { readFileSync } from "fs";
import {
  constants,
  createSecureServer,
  Http2Stream,
  IncomingHttpHeaders,
} from "http2";
import * as admin from "firebase-admin";
import api, { RequestInfo, Route } from "./api";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { fetchUsers } from "./models/user";
import { NotFoundError, UnauthorizedError } from "./models/error";

const app = admin.initializeApp({
  projectId: "neon-estate",
});

async function checkAuthorization(authorization: any): Promise<string> {
  if (typeof authorization !== "string") throw new UnauthorizedError();

  const authMatch = authorization.match(/Bearer ([^ ]+)/);
  if (authMatch === null) throw new UnauthorizedError();
  const [_, token] = authMatch;
  const auth = getAuth(app);
  try {
    const { phone_number: phoneNumber } = await auth.verifyIdToken(token);
    if (!phoneNumber) throw new UnauthorizedError();
    return phoneNumber;
  } catch (e) {
    throw new UnauthorizedError();
  }
}

function readBody(stream: Http2Stream) {
  return new Promise((resolve, reject) => {
    let data = "";
    stream.on("data", (chunk) => (data += chunk));
    stream.on("end", () => resolve(JSON.parse(data)));
    stream.on("error", (err) => reject(err));
  });
}

function corsHandler(
  routes: Route[],
  headers: IncomingHttpHeaders,
): (request: Pick<RequestInfo, "stream">) => Promise<any> {
  const path = headers[constants.HTTP2_HEADER_PATH];
  if (typeof path !== "string") throw new NotFoundError();
  const requestedMethod =
    headers[constants.HTTP2_HEADER_ACCESS_CONTROL_REQUEST_METHOD];
  if (typeof requestedMethod !== "string") throw new NotFoundError();
  const allowedMethods = routes
    .filter((route) => path.match(route.pathMatcher) !== null)
    .map((route) => route.method.toUpperCase());
  if (
    allowedMethods
      .map((method) => method.toLocaleLowerCase())
      .includes(requestedMethod.toLocaleLowerCase())
  )
    return async (req: Pick<RequestInfo, "stream">) => {
      req.stream.respond({
        [constants.HTTP2_HEADER_ACCESS_CONTROL_ALLOW_HEADERS]: [
          constants.HTTP2_HEADER_AUTHORIZATION,
          constants.HTTP2_HEADER_CONTENT_TYPE,
        ].join(", "),
        [constants.HTTP2_HEADER_ACCESS_CONTROL_ALLOW_METHODS]: [
          ...allowedMethods,
          "OPTIONS",
        ].join(", "),
        [constants.HTTP2_HEADER_ACCESS_CONTROL_ALLOW_ORIGIN]:
          process.env.APP_DOMAIN,
        [constants.HTTP2_HEADER_STATUS]: 204,
      });
      return null;
    };
  throw new NotFoundError();
}

function matchHandler(
  routes: Route[],
  headers: IncomingHttpHeaders,
): (
  request: Omit<
    RequestInfo,
    "currentUser" | "getBody" | "pathParams" | "phoneNumber" | "query"
  >,
) => Promise<any> {
  const authorization = headers[constants.HTTP2_HEADER_AUTHORIZATION];
  const method = headers[constants.HTTP2_HEADER_METHOD];
  const path = headers[constants.HTTP2_HEADER_PATH];

  if (typeof method !== "string" || typeof path !== "string")
    throw new NotFoundError();

  if (method.toLocaleLowerCase() === "options")
    return corsHandler(routes, headers);

  if (typeof authorization !== "string") throw new UnauthorizedError();

  const handler = routes
    .filter(
      (route) =>
        route.method.toLocaleLowerCase() === method.toLocaleLowerCase(),
    )
    .map((route) => {
      const pathMatch = path.match(route.pathMatcher);
      if (pathMatch === null) return null;
      const [_, ...pathParams] = pathMatch;
      return (req: Omit<RequestInfo, "pathParams" | "query">) =>
        route.handler({
          ...req,
          pathParams,
          query: new URL(path, process.env.API_DOMAIN).searchParams,
        });
    })
    .find((handler) => handler !== null);

  if (!handler) throw new NotFoundError();

  return async (
    req: Omit<
      RequestInfo,
      "currentUser" | "getBody" | "pathParams" | "phoneNumber" | "query"
    >,
  ) => {
    const phoneNumber = await checkAuthorization(authorization);
    const [currentUser] = await fetchUsers(getFirestore(app), { phoneNumber });
    const result = await handler({
      ...req,
      getBody: () => readBody(req.stream),
      currentUser,
      phoneNumber,
    });
    if (result !== null)
      req.stream.respond({
        [constants.HTTP2_HEADER_ACCESS_CONTROL_ALLOW_CREDENTIALS]: "true",
        [constants.HTTP2_HEADER_ACCESS_CONTROL_ALLOW_ORIGIN]:
          process.env.APP_DOMAIN,
        [constants.HTTP2_HEADER_CACHE_CONTROL]: "max-age=86400",
        [constants.HTTP2_HEADER_CONTENT_TYPE]: "application/json",
        [constants.HTTP2_HEADER_STATUS]: 200,
      });
    return result;
  };
}

const server = createSecureServer({
  key: readFileSync("localhost.key"),
  cert: readFileSync("localhost.crt"),
});

server.on("connection", (stream) => {
  console.log(`New connection from ${stream.remoteAddress}`);
});

server.on("stream", async (stream, headers) => {
  try {
    const handler = matchHandler(api, headers);
    const response = await handler({ stream });
    if (response !== null) stream.write(JSON.stringify(response));
  } catch (err: any) {
    stream.respond({
      [constants.HTTP2_HEADER_ACCESS_CONTROL_ALLOW_CREDENTIALS]: "true",
      [constants.HTTP2_HEADER_ACCESS_CONTROL_ALLOW_ORIGIN]:
        process.env.APP_DOMAIN,
      [constants.HTTP2_HEADER_CACHE_CONTROL]: "max-age=86400",
      [constants.HTTP2_HEADER_CONTENT_TYPE]: "application/json",
      [constants.HTTP2_HEADER_STATUS]: err?.code || 500,
    });
    if (!err?.code) console.error(`Unexpected server error: ${err.toString()}`);
    stream.write(
      JSON.stringify({
        error: err.toString(),
      }),
    );
  }
  stream.end();
});

server.on("error", (err) => console.error(`Server error: ${err.toString()}`));

const port = process.env.PORT || 5001;
server.listen(port, () => {
  console.log(`Server listening on ${port}`);
});
