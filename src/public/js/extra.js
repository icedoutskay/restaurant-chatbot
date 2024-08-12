document.addEventListener("DOMContentLoaded", function () {
    const socket = io();
  
    // DOM elements
    const form = document.getElementById("form");
    const input = document.getElementById("message-box");
    const messages = document.getElementById("messages");
  
    // Handle form submission
    form.addEventListener("submit", function (evt) {
      evt.preventDefault();
      if (input.value.trim()) {
        socket.emit("message", input.value.trim().toLowerCase());
        input.value = "";
      }
    });
  
    // Receive and display messages from server
    socket.on("message", function (msg) {
      const item = document.createElement("li");
      item.classList.add("list-group-item");
      item.innerHTML = msg.text;
      messages.appendChild(item);
      window.scrollTo(0, document.body.scrollHeight);
    });
  });