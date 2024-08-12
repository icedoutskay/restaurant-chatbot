import MemoryStore from "memorystore";
import session from "express-session";


const MemoryStoreInstance = MemoryStore(session);
export const sessionMiddleware = session({
  secret: "your-secret-key",
  resave: false,
  saveUninitialized: true,
  store: new MemoryStoreInstance({
    checkPeriod: 86400000,
  }),
});