const express = require("express");
const path = require("path");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);

// Benutzerliste (Speicherung nur im Speicher!)
let users = [{ username: "admin", password: "admin" }];
let messages = [];

// Statische Dateien (index.html ausliefern)
app.use(express.static(path.join(__dirname)));

io.on("connection", (socket) => {
  console.log("🔌 Neuer Client verbunden");

  // Login prüfen
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

  // Chat-Nachricht empfangen
  socket.on("chat", (msg) => {
    messages.push(msg);
    io.emit("chat", msg);
  });

  // Admin erstellt neuen Benutzer
  socket.on("add_user", (data) => {
    if (data.username && data.password) {
      users.push({ username: data.username, password: data.password });
      console.log("✅ Neuer Benutzer hinzugefügt:", data.username);
      io.emit("chat", { user: "System", text: "Benutzer " + data.username + " wurde erstellt." });
    }
  });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => console.log("✅ Server läuft auf Port " + PORT));
