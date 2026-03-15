import { io } from "socket.io-client";

async function run() {
  const loginRes = await fetch("http://localhost:8000/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@example.com", password: "admin" }) // assuming default creds
  });
  const loginData = await loginRes.json();
  const token = loginData.token;

  const socket = io("ws://localhost:8000", {
    auth: { token }
  });

socket.on("connect", () => {
  console.log("Connected to server");
  // emit a dummy vote to see if we get disconnected or ignored
  socket.emit("poll_vote", { poll_id: "69b5e431d997cd6c3d5f36ba", option_id: "69b5e431d997cd6c3d5f36b9" });
});

socket.on("poll_update", (data) => {
  console.log("Got poll_update", data);
  process.exit(0);
});

socket.on("error", (err) => {
  console.error("Got error:", err);
});

socket.on("disconnect", () => {
  console.log("Disconnected");
});

setTimeout(() => {
  console.log("Timeout waiting for poll_update");
  process.exit(1);
}, 3000);

}
run().catch(console.error);
