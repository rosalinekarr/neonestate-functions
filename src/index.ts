import * as admin from "firebase-admin";
import { onRequest } from "firebase-functions/v2/https";
import api from "./api";

admin.initializeApp({
  projectId: "neon-estate",
});

exports.app = onRequest(
  {
    cors: ["neon.estate"],
  },
  api,
);
