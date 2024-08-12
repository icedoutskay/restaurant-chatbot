import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { join } from "path";
import moment from "moment";
import { sessionMiddleware } from "./src/middleware/session.js";
import route from "./src/route/routes.js";

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);

const port = process.env.PORT || 3000;

app.use(express.static(join(import.meta.dirname, "src", "public")));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(sessionMiddleware);
app.use("/", route);

// websocket

const userSessions = {};

io.engine.use(sessionMiddleware);

io.on("connection", (socket) => {
  // generate unique user id based on device
  const { id, username } = socket.request.session;
  console.log(id);
  if (!userSessions.hasOwnProperty(id)) {
    userSessions[id] = {
      currentOrderHistory: [],
      orderHistory: [],
      chatHistory: [],
      chatState: "initial",
    };
  }
  console.log("a user connected");

  const meals = [
    "Ofada Rice and Chicken",
    "Jollof Rice and Turkey",
    "Amala and Ewedu",
  ];

  const welcomeMessage = `
      <p>Welcome ${username}! Select an option:</p>
      <p>1. Place an order</p>
      <p>97. See current order</p>
      <p>98. See order history</p>
      <p>99. Checkout order</p>
      <p>0. Cancel order</p>
    `;
  // Send initial options to the client
  socket.emit("message", {
    text: welcomeMessage,
  });

  let mealList = "<p>Select an item:</p>";
  meals.forEach((meal, index) => {
    const letter = String.fromCharCode(65 + index); // 65 is ASCII for 'A'
    mealList += `<p>${letter}. ${meal}</p>`;
  });

  // Handle messages from client
  socket.on("message", (message) => {
    console.log("Message from client:", message);

    switch (message) {
      case "1":
        socket.emit("message", {
          text: mealList,
        });
        break;
      case "97":
        // Show current order
        console.log(userSessions[id].currentOrderHistory);
        let currOrderMsg = "<p>";
        userSessions[id].currentOrderHistory.forEach((order, index) => {
          currOrderMsg += `<p>${index + 1}. ${order}</p>`;
        });
        socket.emit("message", {
          text: currOrderMsg,
        });
        socket.emit("message", {
          text: welcomeMessage,
        });
        break;
      case "98":
        // Show order history
        const orderHistory = userSessions[id].orderHistory;
        if (!orderHistory.length) {
          socket.emit("message", {
            text: "You have not made an order before",
          });
          socket.emit("message", {
            text: welcomeMessage,
          });
          break;
        }
        let tableHtml = '<table border="1">';
        // Table headers
        tableHtml += "<tr><th>Order Content</th><th>Date</th></tr>";
        // Iterate over each order in orderHistory
        orderHistory.forEach((order) => {
          // Create a row for each order
          tableHtml += `<tr><td>${order.orderContent}</td><td>${order.date}</td></tr>`;
        });
        tableHtml += "</table>";
        socket.emit("message", {
          text: tableHtml,
        });
        socket.emit("message", {
          text: welcomeMessage,
        });
        break;
      case "99":
        // save/checkout order
        if (!userSessions[id].currentOrderHistory.length) {
          socket.emit("message", {
            text: "No order made",
          });
          socket.emit("message", {
            text: welcomeMessage,
          });
          break;
        }
        const orderContent = userSessions[id].currentOrderHistory;
        const data = {
          date: moment().format("MMMM Do YYYY, h:mm a"),
          orderContent,
        };
        userSessions[id].orderHistory.push(data);
        userSessions[id].currentOrderHistory = [];
        socket.emit("message", { text: "Order saved and sent" });
        socket.emit("message", {
          text: welcomeMessage,
        });
        break;

      case "0":
        // Cancel order
        userSessions[id].currentOrderHistory = [];
        socket.emit("message", { text: "Order cancelled" });
        socket.emit("message", {
          text: welcomeMessage,
        });
        break;
      case "a":
        userSessions[id].currentOrderHistory.push(meals[0]);
        console.log(userSessions[id].currentOrderHistory);
        socket.emit("message", { text: `<p>${meals[0]} ordered</p>` });
        socket.emit("message", {
          text: welcomeMessage,
        });
        break;
      case "b":
        userSessions[id].currentOrderHistory.push(meals[1]);
        console.log(userSessions[id].currentOrderHistory);
        socket.emit("message", { text: `<p>${meals[1]} ordered</p>` });
        socket.emit("message", {
          text: welcomeMessage,
        });
        break;
      case "c":
        userSessions[id].currentOrderHistory.push(meals[2]);
        socket.emit("message", { text: `<p>${meals[2]} ordered</p>` });
        socket.emit("message", {
          text: welcomeMessage,
        });
        break;
      default:
        socket.emit("message", {
          text: "Invalid option. Please choose again.",
        });
        socket.emit("message", {
          text: welcomeMessage,
        });
    }
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});

httpServer.listen(port, () => {
  console.log(`Server started on port: ${port}`);
});