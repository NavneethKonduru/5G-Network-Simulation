const io = require("socket.io-client");
const socket = io("http://localhost:5001");
socket.on("5g_state", (data) => {
    console.log("APS:", JSON.stringify(data.aps));
    process.exit(0);
});
