"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const ejs_1 = require("ejs");
const socket_io_1 = require("socket.io");
const http_1 = require("http");
const app = (0, express_1.default)();
const server = (0, http_1.createServer)(app);
const io = new socket_io_1.Server(server);
app.use(express_1.default.static("public"));
app.set("view engine", "ejs");
app.set("views", "views");
app.engine("html", ejs_1.renderFile);
app.get("/", (_, res) => res.render("index.html"));
app.get("/game", (_, res) => res.render("game.html"));
const AREA_SIZE = 500;
class ConnectedUser {
    constructor(username, _socket, color) {
        this.username = username;
        this._socket = _socket;
        this.color = color;
        this._x = Math.random() * (AREA_SIZE - ConnectedUser.SIZE);
        this._y = Math.random() * (AREA_SIZE - ConnectedUser.SIZE);
        this._socket.emit("user", { type: "OLD", users: users.map((user) => ({ username: user.username, x: user.x, y: user.y, color: user.color })) });
        users.push(this);
        io.emit("chat", { type: "USER", message: username + "님이 들어왔습니다." });
        this._socket.broadcast.emit("user", { type: "NEW", user: { username, x: this._x, y: this._y } });
        this._socket.emit("pos", { username, x: this._x, y: this._y });
    }
    set x(x) {
        if (x > AREA_SIZE - ConnectedUser.SIZE)
            this._x = AREA_SIZE - ConnectedUser.SIZE;
        else if (x < 0)
            this._x = 0;
        else
            this._x = x;
    }
    set y(y) {
        if (y > AREA_SIZE - ConnectedUser.SIZE)
            this._y = AREA_SIZE - ConnectedUser.SIZE;
        else if (y < 0)
            this._y = 0;
        else
            this._y = y;
    }
    broadcastUpdate() {
        this._socket.broadcast.emit("pos", { username: this.username, x: this._x, y: this._y });
        this._socket.broadcast.emit("color", { username: this.username, color: this.color });
    }
    broadcastLeave() {
        users.splice(users.indexOf(this), 1);
        io.emit("chat", { type: "USER", message: this.username + "님이 나갔습니다.", leaveUser: this.username });
        this._socket.broadcast.emit("user", { type: "LEAVE", user: this.username });
    }
}
ConnectedUser.SIZE = 20;
const users = [];
io.on("connection", (socket) => {
    let user;
    socket.once("name", (username) => {
        if (users.find((user) => user.username === username))
            socket.emit("name", { type: "FAILED", message: `${username}'은/는 이미 사용되었습니다.` });
        else {
            socket.emit("name", { type: "SUCCESS" });
            user = new ConnectedUser(username, socket, "white");
        }
    });
    socket.on("pos", (pos) => {
        const { x, y } = pos;
        user.x = x;
        user.y = y;
        user.broadcastUpdate();
    });
    socket.on("color", (color) => {
        user.color = color;
        user.broadcastUpdate();
    });
    socket.on("emote", (emote) => socket.broadcast.emit("emote", { username: user.username, emote }));
    socket.on("chat", (message) => io.emit("chat", { type: "GENERAL", username: user.username, message }));
    socket.on("disconnect", () => user === null || user === void 0 ? void 0 : user.broadcastLeave());
});
server.listen(process.env.PORT, () => console.log("Server is running on port " + process.env.PORT));
