import { Router } from "express";
import { join } from "path";

const route = Router();

route.get("/", (req, res) => {
  if (req.session.username) {
    res.redirect("/chat");
    return;
  }
  res.sendFile(join(import.meta.dirname, "..", "public", "index.html"));
});

route.post("/", (req, res) => {
  req.session.username = req.body.username;
  res.redirect("/chat");
});

route.get("/chat", (req, res) => {
  if (req.session.username) {
    res.sendFile(join(import.meta.dirname, "..", "public", "chat.html"));
    return;
  }
  res.redirect("/");
});

export default route;