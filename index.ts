import "dotenv/config";
import express from "express";
import { renderFile } from "ejs";
import { Server, Socket } from "socket.io";
import { createServer } from "http";

const app = express();
const server = createServer(app);
const io = new Server(server);

app.use(express.static("public"));

app.set("view engine", "ejs");
app.set("views", "views");
app.engine("html", renderFile);

app.get("/", (_, res) => res.render("index.html"));
app.get("/game", (_, res) => res.render("game.html"));

const AREA_SIZE = 500;

class ConnectedUser {
	public static readonly SIZE = 20;
	private _x;
	private _y;

	constructor(public username: string, private _socket: Socket, public color: string) {
		this._x = Math.random() * (AREA_SIZE - ConnectedUser.SIZE);
		this._y = Math.random() * (AREA_SIZE - ConnectedUser.SIZE);

		this._socket.on("pos", (pos) => {
			const { x, y } = pos;
			this.x = x;
			this.y = y;
			this.broadcastUpdate();
		});
		this._socket.on("color", (color) => {
			this.color = color;
			this.broadcastUpdate();
		});
		this._socket.on("emote", (emote) => this._socket.broadcast.emit("emote", { username: this.username, emote }));
		this._socket.on("chat", (message) => io.emit("chat", { type: "GENERAL", username: this.username, message }));

		this._socket.emit("user", { type: "OLD", users: users.map((user) => ({ username: user.username, x: user.x, y: user.y, color: user.color })) });

		users.push(this);
		io.emit("chat", { type: "USER", message: username + "님이 들어왔습니다." });

		this._socket.broadcast.emit("user", { type: "NEW", user: { username, x: this._x, y: this._y } });
		this._socket.emit("pos", { username, x: this._x, y: this._y });
	}

	set x(x: number) {
		if (x > AREA_SIZE - ConnectedUser.SIZE) this._x = AREA_SIZE - ConnectedUser.SIZE;
		else if (x < 0) this._x = 0;
		else this._x = x;
	}

	set y(y: number) {
		if (y > AREA_SIZE - ConnectedUser.SIZE) this._y = AREA_SIZE - ConnectedUser.SIZE;
		else if (y < 0) this._y = 0;
		else this._y = y;
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

const users: ConnectedUser[] = [];
io.on("connection", (socket) => {
	let user: ConnectedUser;
	socket.once("name", (username) => {
		if (users.find((user) => user.username === username)) socket.emit("name", { type: "FAILED", message: `${username}'은/는 이미 사용되었습니다.` });
		else {
			socket.emit("name", { type: "SUCCESS" });
			user = new ConnectedUser(username, socket, "white");
		}
	});

	socket.on("disconnect", () => user?.broadcastLeave());
});

server.listen(process.env.PORT, () => console.log("Server is running on port " + process.env.PORT));
