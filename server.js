const express = require("express");
conconst express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);
const fs = require("fs");
const path = require("path");

const usersFile = path.join(__dirname, "users.json");
const messagesFile = path.join(__dirname, "messages.json");

// Nutzer einlesen
let users = {};
if (fs.existsSync(usersFile)) {
  users = JSON.parse(fs.readFileSync(usersFile, "utf-8"));
} else {
  users = { "admin": "admin" }; // Standard-Admin
  fs.writeFileSync(usersFile, JSON.stringify(users, null, 2), "utf-8");
}

// Nachrichten einlesen
let messages = [];
if (fs.existsSync(messagesFile)) {
  messages = JSON.parse(fs.readFileSync(messagesFile, "utf-8"));
} else {
  messages = [
    { user: "System", text: "👋 Willkommen im Familienchat!", time: new Date().toISOString() }
  ];
  fs.writeFileSync(messagesFile, JSON.stringify(messages, null, 2), "utf-8");
}

// Speicherfunktionen
function saveUsers() {
  fs.writeFileSync(usersFile, JSON.stringify(users, null, 2), "utf-8");
}
function saveMessages() {
  fs.writeFileSync(messagesFile, JSON.stringify(messages, null, 2), "utf-8");
}

// Statische Dateien ausliefern (index.html + CSS + Bilder + JS)
app.use(express.static(__dirname));

// ⚠️ KEIN zweites app.get("/") hier, sonst doppelte Anzeige!

// Socket.IO
io.on("connection", (socket) => {
  console.log("🔗 Neuer Benutzer verbunden");

  // Login
  socket.on("login", (data) => {
    const { username, password } = data;

    if (users[username] && users[username] === password) {
      socket.username = username;
      socket.emit("login_success", username);

      // Gespeicherte Nachrichten laden
      socket.emit("load_messages", messages);

      console.log(`✅ Login erfolgreich: ${username}`);
      return;
    }

    socket.emit("login_failed");
    console.log(`❌ Fehlgeschlagener Login für Benutzer: ${username}`);
  });

  // Chat
  socket.on("chat", (msg) => {
    if (!socket.username) return;

    const message = { user: socket.username, text: msg.text, time: new Date().toISOString() };
    messages.push(message);
    saveMessages();

    io.emit("chat", message);
  });

  // Benutzer hinzufügen
  socket.on("add_user", (data) => {
    if (socket.username === "admin") {
      if (users[data.username]) {
        socket.emit("chat", { user: "System", text: `⚠️ Benutzer '${data.username}' existiert bereits.` });
      } else {
        users[data.username] = data.password;
        saveUsers();
        socket.emit("chat", { user: "System", text: `✅ Benutzer '${data.username}' hinzugefügt.` });
        console.log(`👤 Neuer Benutzer hinzugefügt: ${data.username}`);
      }
    }
  });

  // Benutzer löschen
  socket.on("delete_user", (data) => {
    if (socket.username === "admin") {
      if (users[data.username]) {
        delete users[data.username];
        saveUsers();
        socket.emit("chat", { user: "System", text: `✅ Benutzer '${data.username}' wurde gelöscht.` });
        console.log(`🗑️ Benutzer gelöscht: ${data.username}`);
      }
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
  socket.on("disconnect", () => {
    console.log("❎ Benutzer hat die Verbindung getrennt");
  });
});

// Server starten
const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
  console.log(`🚀 Server läuft auf Port ${PORT}`);
});
