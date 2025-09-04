const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);

// Benutzer speichern (einfaches In-Memory-Objekt)
// 👉 Admin-Zugang: Benutzername: admin / Passwort: admin
let users = {
  "admin": "admin"
};

// Statische Dateien direkt aus dem Projekt-Hauptordner laden
app.use(express.static(__dirname));

io.on("connection", (socket) => {
  console.log("🔗 Neuer Benutzer verbunden");

  // Login
  socket.on("login", (data) => {
    const { username, password } = data;

    if (users[username] && users[username] === password) {
      socket.username = username;
      socket.emit("login_success", username);
      console.log(`✅ Login erfolgreich: ${username}`);
    } else {
      socket.emit("login_failed");
      console.log(`❌ Fehlgeschlagener Login für Benutzer: ${username}`);
    }
  });

  // Chat-Nachrichten
  socket.on("chat", (msg) => {
    if (!socket.username) return; // Nur eingeloggt chatten
    io.emit("chat", msg);
  });

  // Benutzer hinzufügen (nur Admin)
  socket.on("add_user", (data) => {
    if (socket.username === "admin") {
      if (users[data.username]) {
        socket.emit("chat", { user: "System", text: `⚠️ Benutzer '${data.username}' existiert bereits.` });
      } else {
        users[data.username] = data.password;
        socket.emit("chat", { user: "System", text: `✅ Benutzer '${data.username}' hinzugefügt.` });
        console.log(`👤 Neuer Benutzer hinzugefügt: ${data.username}`);
      }
    } else {
      socket.emit("chat", { user: "System", text: "❌ Nur der Admin darf Benutzer hinzufügen." });
    }
  });

  // Benutzer löschen (nur Admin)
  socket.on("delete_user", (data) => {
    if (socket.username === "admin") {
      if (users[data.username]) {
        delete users[data.username];
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
