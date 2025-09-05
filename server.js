const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);
const bcrypt = require("bcrypt");
const fs = require("fs");
const path = require("path");

const usersFile = path.join(__dirname, "users.json");

// Nutzer beim Start einlesen
let users = {};
if (fs.existsSync(usersFile)) {
  users = JSON.parse(fs.readFileSync(usersFile, "utf-8"));
} else {
  users = {};
}

// Funktion zum Speichern in JSON-Datei
function saveUsers() {
  fs.writeFileSync(usersFile, JSON.stringify(users, null, 2), "utf-8");
}

// Statische Dateien laden
app.use(express.static(__dirname));

io.on("connection", (socket) => {
  console.log("🔗 Neuer Benutzer verbunden");

  // Login
  socket.on("login", async (data) => {
    const { username, password } = data;

    if (users[username]) {
      const valid = await bcrypt.compare(password, users[username]);
      if (valid) {
        socket.username = username;
        socket.emit("login_success", username);
        console.log(`✅ Login erfolgreich: ${username}`);
        return;
      }
    }

    socket.emit("login_failed");
    console.log(`❌ Fehlgeschlagener Login für Benutzer: ${username}`);
  });

  // Chat
  socket.on("chat", (msg) => {
    if (!socket.username) return;
    io.emit("chat", msg);
  });

  // Benutzer hinzufügen
  socket.on("add_user", async (data) => {
    if (socket.username === "admin") {
      if (users[data.username]) {
        socket.emit("chat", { user: "System", text: `⚠️ Benutzer '${data.username}' existiert bereits.` });
      } else {
        const hashed = await bcrypt.hash(data.password, 10);
        users[data.username] = hashed;
        saveUsers(); // ⬅️ in Datei speichern
        socket.emit("chat", { user: "System", text: `✅ Benutzer '${data.username}' hinzugefügt.` });
        console.log(`👤 Neuer Benutzer hinzugefügt: ${data.username}`);
      }
    } else {
      socket.emit("chat", { user: "System", text: "❌ Nur der Admin darf Benutzer hinzufügen." });
    }
  });

  // Benutzer löschen
  socket.on("delete_user", (data) => {
    if (socket.username === "admin") {
      if (users[data.username]) {
        delete users[data.username];
        saveUsers(); // ⬅️ in Datei speichern
        socket.emit("chat", { user: "System", text: `✅ Benutzer '${data.username}' wurde gelöscht.` });
        console.log(`🗑️ Benutzer gelöscht: ${data.username}`);
      } else {
        socket.emit("chat", { user: "System", text: `⚠️ Benutzer '${data.username}' existiert nicht.` });
      }
    } else {
      socket.emit("chat", { user: "System", text: "❌ Nur der Admin darf Benutzer löschen." });
    }
  });

  socket.on("disconnect", () => {
    console.log("❎ Benutzer hat die Verbindung getrennt");
  });
});

// Server starten
const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
  console.log(`🚀 Server läuft auf Port ${PORT}`);
});
