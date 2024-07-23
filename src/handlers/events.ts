import { constants } from "http2";
import type { paths } from "../schema";
import { RequestInfo } from "../api";
import { subscribe } from "../models/event";

export type ListenEventsResponse = paths["/events"]["get"]["responses"][200];

export async function listenEvents({
  phoneNumber,
  stream,
}: RequestInfo): Promise<null> {
  stream.respond({
    [constants.HTTP2_HEADER_ACCESS_CONTROL_ALLOW_CREDENTIALS]: "true",
    [constants.HTTP2_HEADER_ACCESS_CONTROL_ALLOW_ORIGIN]:
      process.env.APP_DOMAIN,
    [constants.HTTP2_HEADER_CACHE_CONTROL]: "no-cache",
    [constants.HTTP2_HEADER_CONTENT_TYPE]: "text/event-stream",
    [constants.HTTP2_HEADER_STATUS]: 200,
  });

  const unsubscribeFns = ["postcreated", "usercreated", "userupdated"].map(
    (eventType) =>
      subscribe(eventType, (data: any) => {
        console.log(
          `Sending ${eventType} event to ${phoneNumber}: ${JSON.stringify(data)}`,
        );
        stream.write(`event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`);
      }),
  );

  return new Promise((resolve) => {
    stream.on("close", () => {
      unsubscribeFns.forEach((fn) => fn());
      resolve(null);
    });
  });
}
