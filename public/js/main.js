const socket = io();

const AREA_SIZE = 500;

class ExplodeCircle {
	constructor(user) {
		this.user = user;
		this.x = user.x + User.SIZE / 2;
		this.y = user.y + User.SIZE / 2;
		this.radius = User.SIZE / 2;
		this.color = user.color;
		this.alpha = 1;

		entities.push(this);
	}

	update() {
		this.radius += this.alpha * 10;
		this.alpha -= 0.05;

		if (this.alpha <= 0) {
			entities.splice(entities.indexOf(this), 1);
			this.user.emoting = false;
		}
	}

	draw() {
		ctx.globalAlpha = this.alpha < 0 ? 0 : this.alpha;
		ctx.fillStyle = this.color;

		ctx.beginPath();
		ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
		ctx.fill();

		ctx.globalAlpha = 1;
	}
}

class MessageBubble {
	static get MAX_WIDTH() {
		return 100;
	}

	constructor(user, text) {
		this.user = user;
		this.offset = this.user.messageBubbles.indexOf(this) * 30;
		this.x = user.x + User.SIZE / 2;
		this.y = user.y - 36 - this.offset;
		this.alpha = 1;
		this.text = text;
		this.disappear = false;

		if (ctx.measureText(this.text).width > MessageBubble.MAX_WIDTH) {
			while (ctx.measureText(this.text).width >= MessageBubble.MAX_WIDTH) this.text = this.text.substring(0, this.text.length - 1);
			this.text += "...";
		}

		entities.push(this);
		this.timeout = setTimeout(() => (this.disappear = true), 2000);
	}

	update() {
		if (this.disappear) this.alpha -= 0.1;

		this.offset = this.user.messageBubbles.indexOf(this) * 20;
		this.x = this.user.x + User.SIZE / 2;
		this.y = this.user.y - 36 - this.offset;

		if (this.alpha <= 0) {
			entities.splice(entities.indexOf(this), 1);
			this.user.messageBubbles.splice(this.user.messageBubbles.indexOf(this), 1);
		}
	}

	draw() {
		const width = ctx.measureText(this.text).width;

		ctx.globalAlpha = this.alpha < 0 ? 0 : this.alpha;

		ctx.fillStyle = "white";
		ctx.fillRect(this.x - width / 2 - 4, this.y - 4, width + 8, 20);
		ctx.fillStyle = "black";
		ctx.fillText(this.text, this.x, this.y + 10);

		ctx.globalAlpha = 1;
	}
}

class Face {
	static get EMOTIONS() {
		return ["happy", "sad"];
	}

	constructor(user, emotion) {
		if (!Face.EMOTIONS.includes(emotion)) throw new Error(emotion + " doesn't exists in Face.EMOTIONS.");

		this.user = user;
		this.emotion = emotion;
		this.x = user.x + User.SIZE / 2;
		this.y = emotion === "happy" ? user.y + User.SIZE / 2 : user.y + User.SIZE;

		entities.push(this);
		setTimeout(() => {
			entities.splice(entities.indexOf(this), 1);
			user.emoting = false;
		}, 2500);
	}

	update() {
		this.x = this.user.x + User.SIZE / 2;
		this.y = this.emotion === "happy" ? this.user.y + User.SIZE / 2 : this.user.y + User.SIZE;
	}

	draw() {
		ctx.fillStyle = ctx.strokeStyle = "rgb(30, 30, 30)";
		ctx.lineWidth = 1;

		ctx.beginPath();
		ctx.arc(this.user.x + User.SIZE / 4, this.user.y + User.SIZE * 0.3, 2, 0, 2 * Math.PI);
		ctx.fill();

		ctx.beginPath();
		ctx.arc(this.user.x + (User.SIZE / 4) * 3, this.user.y + User.SIZE * 0.3, 2, 0, 2 * Math.PI);
		ctx.fill();

		const startAngle = this.emotion === "happy" ? 0.15 * Math.PI : 1.15 * Math.PI;
		const endAngle = this.emotion === "happy" ? 0.85 * Math.PI :  1.85 * Math.PI;

		ctx.beginPath();
		ctx.arc(this.x, this.y, User.SIZE / 2 - 4, startAngle, endAngle);
		ctx.stroke();
	}
}

class User {
	static get SIZE() {
		return 20;
	}

	static get EMOTES() {
		return ["rotate", "explode", "smile", "sad"];
	}

	constructor(username, x, y, color) {
		this.username = username;
		this.x = x;
		this.y = y;
		this.color = color;
		this.emoting = false;
		this.angle = 0;
		this.messageBubbles = [];
	}

	draw() {
		ctx.fillStyle = "white";
		ctx.fillText(this.username, this.x + User.SIZE / 2, this.y - 6);

		if (this.angle > 0) {
			ctx.save();
			ctx.translate(this.x + User.SIZE / 2, this.y + User.SIZE / 2);
			ctx.rotate((Math.PI / 180) * this.angle);

			ctx.fillStyle = this.color;
			ctx.fillRect(-User.SIZE / 2, -User.SIZE / 2, User.SIZE, User.SIZE);

			ctx.restore();
		} else {
			ctx.fillStyle = this.color;
			ctx.fillRect(this.x, this.y, User.SIZE, User.SIZE);
		}
	}

	updatePos(x, y) {
		if (y > AREA_SIZE - User.SIZE) this.y = AREA_SIZE - User.SIZE;
		else if (y < 0) this.y = 0;
		else this.y = y;

		if (x > AREA_SIZE - User.SIZE) this.x = AREA_SIZE - User.SIZE;
		else if (x < 0) this.x = 0;
		else this.x = x;
	}

	emote(emote) {
		if (this.emoting) return;

		this.emoting = true;

		if (emote === "rotate") {
			const rotateInterval = setInterval(() => {
				this.angle += 5;

				if (this.angle >= 360) {
					this.angle = 0;
					this.emoting = false;
					clearInterval(rotateInterval);
				}
			}, 10);
		} else if (emote === "explode") new ExplodeCircle(this);
		else if (emote === "smile") new Face(this, "happy");
		else if (emote === "sad") new Face(this, "sad");
	}

	addMessage(message) {
		if (this.messageBubbles.length >= 2) {
			const messageBubble = this.messageBubbles.pop();
			clearTimeout(messageBubble.timeout);
			entities.splice(entities.indexOf(messageBubble), 1);
		}

		this.messageBubbles.unshift(new MessageBubble(this, message));
	}
}

class Me extends User {
	#updateTimer = 0;

	update(timeElapsed) {
		if (keys.w && this.y >= 0) this.y -= 2;
		if (keys.s && this.y + User.SIZE <= AREA_SIZE) this.y += 2;
		if (keys.a && this.x >= 0) this.x -= 2;
		if (keys.d && this.x + User.SIZE <= AREA_SIZE) this.x += 2;

		this.sendPos(timeElapsed);
	}

	emote(emote) {
		socket.emit("emote", emote);
		super.emote(emote);
	}

	changeColor(color) {
		if (this.color === color) return;

		this.color = color;
		socket.emit("color", color);
	}

	sendPos(timeElapsed) {
		this.#updateTimer -= timeElapsed;

		if (this.#updateTimer <= 0) {
			this.#updateTimer = 0.05;
			socket.emit("pos", { x: this.x, y: this.y });
		}
	}
}

const users = [];
const entities = [];
const username = new URL(location.href).searchParams.get("usr");
let me;

socket.once("name", (data) => {
	if (data.type === "FAILED") {
		alert(data.message);
		location.assign("/");
	} else startGame();
});
socket.emit("name", username);

function startGame() {
	socket.on("chat", (data) => {
		const { type, message } = data;

		if (type === "USER") userMessage(message);
		else generalMessage(data.username, message);
	});
	socket.on("pos", (data) => {
		const { x, y } = data;
		if (data.username === username) {
			me = new Me(username, x, y);
			users.push(me);
		} else users.find((user) => user.username === data.username).updatePos(x, y);
	});
	socket.on("color", (data) => (users.find((user) => user.username === data.username).color = data.color));
	socket.on("emote", (data) => (users.find((user) => user.username === data.username).emote(data.emote)));
	socket.on("user", (data) => {
		const { type } = data;

		if (type === "OLD") data.users.forEach((user) => users.push(new User(user.username, user.x, user.y, user.color)));
		else if (type === "NEW") users.push(new User(data.user.username, data.user.x, data.user.y, "white"));
		else if (type === "LEAVE") users.splice(users.indexOf(users.find((user) => user.username === data.user)), 1);
	});

	requestAnimationFrame(animate);
}

const chatList = document.querySelector("#chatList");
const chatInput = document.querySelector("#chatInput");
const colorInput = document.querySelector("#colorInput");

chatInput.addEventListener("keydown", (e) => {
	if (!e.shiftKey && !e.repeat && e.key === "Enter" && chatInput.value) {
		e.preventDefault();

		if (chatInput.value.startsWith("/emote ")) {
			const emote = chatInput.value.split(" ")[1];

			if (!User.EMOTES.includes(emote)) alert(`감정 표현 목록에 ${emote}이/가 없습니다.`);
			else me.emote(emote);
		} else socket.emit("chat", chatInput.value);

		chatInput.value = "";
	}
});
colorInput.addEventListener("change", () => me.changeColor(colorInput.value));

function userMessage(message) {
	const messageElement = document.createElement("li");

	messageElement.classList.add("user");
	messageElement.innerHTML = `<div class="text">${message}</div>`;

	chatList.appendChild(messageElement);
	chatList.scroll(0, chatList.scrollHeight);
}

function generalMessage(username, message) {
	const messageElement = document.createElement("li");

	messageElement.classList.add("general");
	messageElement.innerHTML = `
		<div class="username" ${username === me.username ? "style='color: yellow'" : ""}>${username}</div>
		<div class="text">${message}</div>
	`;

	users.find((user) => user.username === username).addMessage(message);

	chatList.appendChild(messageElement);
	chatList.scroll(0, chatList.scrollHeight);
}

const canvas = document.querySelector("canvas");
const ctx = canvas.getContext("2d");

const notoSansFont = new FontFace("NotoSansKR", "url(/fonts/NotoSansKR-Regular.otf)");
notoSansFont.load().then((font) => {
	document.fonts.add(font);
	ctx.font = "12px NotoSansKR";
});

ctx.textAlign = "center";

const keys = {};

window.addEventListener("keydown", (e) => {
	if (e.target.matches("textarea, input")) return;
	if (["w", "a", "s", "d"].includes(e.key.toLowerCase())) keys[e.key.toLowerCase()] = true;
});
window.addEventListener("keyup", (e) => {
	if (e.target.matches("textarea, input")) return;
	if (["w", "a", "s", "d"].includes(e.key.toLowerCase())) keys[e.key.toLowerCase()] = false;
});

let previousTime;
function animate(time) {
	if (previousTime === undefined) previousTime = time;

	ctx.clearRect(0, 0, canvas.width, canvas.height);

	for (let user of users) {
		if (user instanceof Me) user.update((time - previousTime) * 0.001);
		user.draw();
	}

	for (let entity of entities) {
		entity.update();
		entity.draw();
	}

	previousTime = time;

	requestAnimationFrame(animate);
}
