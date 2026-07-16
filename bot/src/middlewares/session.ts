import { session } from "grammy";
import { SessionData } from "../types";
import { config } from "../config";
import { createRedisSessionAdapter } from "./redis-session";

/**
 * Initial session data for each chat.
 */
function initialSession(): SessionData {
  return {
    step: "idle",
    lang: "uz",
    isLoggedIn: false,
    lastActivity: Date.now(),
    historyPage: 0,
    broadcastMessage: undefined,
    tempRegistration: null,
  };
}

/**
 * Session middleware — Redis in production, in-memory in development.
 */
export const sessionMiddleware = session({
  initial: initialSession,
  storage:
    config.app.env === "production"
      ? createRedisSessionAdapter()
      : undefined, // MemoryStorage in dev
});
