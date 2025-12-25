const express = require("express");
const http = require("http");
const path = require("path");
const socketio = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = socketio(server);

// Use Render's assigned port or fallback to 7004 for local
const PORT = process.env.PORT || 7004;

// Socket.io connection
io.on("connection", (socket) => {
    console.log("A user connected: " + socket.id);

    // Listen for location data from the client
    socket.on("send-location", (data) => {
        // Broadcast the location data to all connected clients
        io.emit("receive-location", { id: socket.id, ...data });
    });

    // Handle client disconnect
    socket.on("disconnect", () => {
        console.log("User disconnected: " + socket.id);
    });
});

// Set EJS as the templating engine
app.set("view engine", "ejs");

// Serve static files from the "public" folder
app.use(express.static(path.join(__dirname, "public")));

// Root route renders index.ejs
app.get("/", (req, res) => {
    res.render("index");
});

// Start server
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
