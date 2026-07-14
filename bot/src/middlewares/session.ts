import { session } from "grammy";
import { SessionData } from "../types";

/**
 * Initial session data for each chat.
 * In-memory session storage (production will use Redis).
 */
function initialSession(): SessionData {
  return {
    step: "idle",
    lang: "uz",
    isLoggedIn: false,
    historyPage: 0,
    tempRegistration: null,
  };
}

export const sessionMiddleware = session({
  initial: initialSession,
  // In-memory storage — replace with Redis in production
  storage: undefined, // uses default MemoryStorage
});
