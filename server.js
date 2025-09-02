const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);

let users = [{ username: "admin", password: "admin" }];
let messages = [];

app.use(express.static(__dirname)); // index.html ausliefern

io.on("connection", (socket) => {
  socket.on("login", (data) => {
    const user = users.find(
      (u) => u.username === data.username && u.password === data.password
    );
    if (user) {
      socket.emit("login_success", data.username);
    } else {
      socket.emit("login_failed");
    }
  });

  socket.on("chat", (msg) => {
    messages.push(msg);
    io.emit("chat", msg);
  });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => console.log("✅ Server läuft auf Port " + PORT));
