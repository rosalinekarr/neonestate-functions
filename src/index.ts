import * as admin from "firebase-admin";
import { onRequest } from "firebase-functions/v2/https";
import api from "./api";

admin.initializeApp({
  projectId: "neon-estate",
});

exports.api = onRequest(
  {
    cors: ["https://neon.estate"],
  },
  api,
);
