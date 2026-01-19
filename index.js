const express = require("express");
const multer = require("multer");
const fs = require("fs");
const login = require("josh-fca");
const path = require("path");

const app = express();
const port = 21384;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static("public"));

const upload = multer({ dest: "uploads/" });

const RECOVERY_FILE = "recovery.json";
const DEVICE_FILE = "device.json";
const USERS_FILE = "users.json";

const activeTasks = {};
const loggedInUsers = {};
const taskStartTime = {};
const fixedClientID = "VedantPandit00112233";

// --- Theme Colors (Dark Hunter) ---
const theme = {
  background: "#1e293b", // Dark Gray-Blue
  text: "#f8fafc", // Off-White
  primary: "#4ade80", // Green
  secondary: "#64748b", // Slate Gray
  error: "#f43f5e", // Red
  success: "#a3e635", // Lime Green
  warning: "#facc15" // Yellow
};

// User authentication
function loadUsers() {
  if (fs.existsSync(USERS_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(USERS_FILE, "utf8"));
    } catch (e) {
      console.error(`\x1b[31m❌ Failed to parse users file: ${e}\x1b[0m`); // Red Error
    }
  }
  // Default admin user
  return [{ username: "admin", password: "admin123" }];
}

function saveUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

function parseCookies(rawCookies) {
  const cookies = {};
  rawCookies.split(";").forEach((item) => {
    const [key, value] = item.trim().split("=");
    if (key && value) cookies[key] = value;
  });
  return cookies;
}

function convertToAppState(cookies) {
  const currentDate = new Date().toISOString();
  return Object.entries(cookies).map(([key, value]) => ({
    key,
    value,
    domain: "facebook.com",
    path: "/",
    hostOnly: false,
    secure: true,
    httpOnly: false,
    creation: currentDate,
    lastAccessed: currentDate,
  }));
}

function loadRecoveryData() {
  if (fs.existsSync(RECOVERY_FILE)) {
    try {
      const raw = fs.readFileSync(RECOVERY_FILE, "utf8");
      const data = JSON.parse(raw);
      if (Array.isArray(data.users)) return data.users;
    } catch (e) {
      console.error(`\x1b[31m❌ Failed to parse recovery file: ${e}\x1b[0m`); // Red Error
    }
  }
  return [];
}

function saveRecoveryData(users) {
  fs.writeFileSync(RECOVERY_FILE, JSON.stringify({ users }, null, 2));
}

function updateUserProgress(uid, data) {
  const all = loadRecoveryData();
  const index = all.findIndex((u) => u.uid === uid);
  if (index >= 0) {
    all[index] = { ...all[index], ...data };
  } else {
    all.push(data);
  }
  saveRecoveryData(all);
}

function saveDeviceInfo(api) {
  const fallbackUserAgent =
    "Dalvik/2.1.0 (Linux; U; Android 10; SM-A107F Build/QP1A.190711.020)";
  const device = {
    clientID: api.clientID || fixedClientID,
    mqttClientID: api.mqttClientID || null,
    userAgent: api.userAgent || api?.ctx?.userAgent || fallbackUserAgent,
    ctx: api.ctx || {},
  };
  try {
    fs.writeFileSync(DEVICE_FILE, JSON.stringify(device, null, 2));
    console.log(`\x1b[32m✅ Device info saved\x1b[0m`); // Green Success
  } catch (err) {
    console.log(`\x1b[31m❌ Failed to save device info: ${err}\x1b[0m`); // Red Error
  }
}

function loadDeviceInfo() {
  if (fs.existsSync(DEVICE_FILE)) {
    try {
      const device = JSON.parse(fs.readFileSync(DEVICE_FILE, "utf8"));
      return {
        clientID: device.clientID || fixedClientID,
        mqttClientID: device.mqttClientID || null,
        ctx: device.ctx || {},
        userAgent:
          device.userAgent ||
          "Dalvik/2.1.0 (Linux; U; Android 10; SM-A107F Build/QP1A.190711.020",
      };
    } catch (e) {
          console.log(`\x1b[31m❌ Failed to load device info: ${e}\x1b[0m`); // Red Error
    }
  }
  return {};
}

function getLoginOptions(appState, deviceInfo) {
  return {
    appState,
    clientID: deviceInfo?.clientID || fixedClientID,
    forceLogin: true,
    listenEvents: false,
    autoMarkDelivery: false,
    selfListen: false,
    updatePresence: false,
    logLevel: "silent",
    AutoReconnect: true,
    AutoRefresh: true,
    AutoRefreshFbDtsg: true,
    BypassLoginCaptcha: true,
    BypassAutomationBehavior: true,
    ctx: deviceInfo?.ctx || {},
    userAgent:
      deviceInfo?.userAgent ||
      "Dalvik/2.1.0 (Linux; U; Android 10; SM-A107F Build/QP1A.190711.020",
    mqttClientID: deviceInfo?.mqttClientID || null,
  };
}

function formatUptime(milliseconds) {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ${hours % 24}h ${minutes % 60}m`;
  if (hours > 0) return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}

// Serve main page
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Login endpoint
app.post("/api/login", (req, res) => {
  const { username, password } = req.body;
  const users = loadUsers();
  const user = users.find(
    (u) => u.username === username && u.password === password
  );

  if (user) {
    res.json({ success: true });
  } else {
    res.json({ success: false, error: "Invalid username or password" });
  }
});

// Get all tasks status
app.get("/api/tasks", (req, res) => {
  const tasks = loadRecoveryData().map((task) => {
    const isActive = activeTasks[task.uid] === true;
    const uptime =
      isActive && taskStartTime[task.uid] ? Date.now() - taskStartTime[task.uid] : 0;

    return {
      uid: task.uid,
      type: task.type || "message",
      targetUid: task.targetUid,
      groupId: task.groupId,
      hatersName: task.hatersName,
      desiredGroupName: task.desiredGroupName,
      delay: task.delay,
      status: isActive ? "running" : "stopped",
      cookieStatus: task.cookieStatus || "valid",
      uptime: formatUptime(uptime),
      currentIndex: task.currentIndex || 0,
    };
  });

  res.json({ tasks });
});

// Message sender - Login with cookies
app.post("/api/message-sender/login", (req, res) => {
  const { cookies } = req.body;
  if (!cookies)
    return res
      .status(400)
      .json({ success: false, error: "No cookies provided." });
  const parsedCookies = parseCookies(cookies);
  const appState = convertToAppState(parsedCookies);
  const deviceInfo = loadDeviceInfo();
  login(getLoginOptions(appState, deviceInfo), (err, api) => {
    if (err) {
      console.log(`\x1b[31m❌ Login failed: ${err}\x1b[0m`); // Red Error
      return res.json({
        success: false,
        error: "Login failed. Please check your cookies.",
      });
    }
    saveDeviceInfo(api);
    const uid = api.getCurrentUserID();
    loggedInUsers[uid] = { appState, currentIndex: 0, type: "message" };

    res.json({ success: true, uid });
  });
});

// Message sender - Start task
app.post("/api/message-sender/start", upload.single("messages"), (req, res) => {
  const { delay, hatersName, targetUid } = req.body;
  if (!req.file || !delay || !hatersName || !targetUid) {
    return res
      .status(400)
      .json({ success: false, error: "Missing required fields." });
  }
  const filePath = req.file.path;
  const rawMessages = fs.readFileSync(filePath, "utf8");
  const messages = rawMessages.split("\n").filter(Boolean);
  fs.unlinkSync(filePath);
  let started = 0;
  for (const [uid, data] of Object.entries(loggedInUsers)) {
    if (data.type === "message") {
      startMessageProcess(
        data.appState,
        uid,
        messages,
                parseInt(delay),
        hatersName,
        targetUid,
        1,
        data.currentIndex || 0
      );
      started++;
    }
  }
  res.json({
    success: true,
    message: `Started message sending from ${started} accounts`,
  });
});

function startMessageProcess(
  appState,
  uid,
  messages,
  delay,
  hatersName,
  targetUid,
  attempt = 1,
  index = 0
) {
  if (activeTasks[uid]) return;

  const deviceInfo = loadDeviceInfo();
  login(getLoginOptions(appState, deviceInfo), (err, api) => {
    if (err) {
      if (attempt < 2) {
        console.log(`\x1b[33m[${uid}] Login failed. Retrying (${attempt + 1}/2)...\x1b[0m`); // Yellow Warning
        return setTimeout(() => {
          startMessageProcess(
            appState,
            uid,
            messages,
            delay,
            hatersName,
            targetUid,
            attempt + 1,
            index
          );
        }, 3000);
      } else {
        console.log(`\x1b[31m[${uid}] ❌ Login failed twice. Marking as expired.\x1b[0m`); // Red Error
        updateUserProgress(uid, {
          uid,
          type: "message",
          cookies: appState.map((c) => `${c.key}=${c.value}`).join("; "),
          delay,
          hatersName,
          targetUid,
          messages,
          currentIndex: index,
          cookieStatus: "expired",
        });
        delete activeTasks[uid];
        delete loggedInUsers[uid];
        return;
      }
    }
    saveDeviceInfo(api);
    activeTasks[uid] = true;
    taskStartTime[uid] = Date.now();

    function sendLoop() {
      if (!activeTasks[uid]) return;

      const msg = `${hatersName} ${messages[index]}`;
      api.sendMessage(msg, targetUid, (err) => {
        if (err) {
          console.log(`\x1b[31m[${uid}] ❌ Message failed: ${err}\x1b[0m`); // Red Error
          updateUserProgress(uid, {
            uid,
            type: "message",
            cookies: appState.map((c) => `${c.key}=${c.value}`).join("; "),
            delay,
            hatersName,
            targetUid,
            messages,
            currentIndex: index,
            cookieStatus: "expired",
          });
          delete activeTasks[uid];
          delete loggedInUsers[uid];
          delete taskStartTime[uid];
          return;
        }
        console.log(`\x1b[32m[${uid}] ✅ Sent to ${targetUid}: ${msg}\x1b[0m`); // Green Success
        index = (index + 1) % messages.length;
        if (loggedInUsers[uid]) loggedInUsers[uid].currentIndex = index;
        updateUserProgress(uid, {
          uid,
          type: "message",
          cookies: appState.map((c) => `${c.key}=${c.value}`).join("; "),
          delay,
          hatersName,
          targetUid,
          messages,
          currentIndex: index,
          cookieStatus: "valid",
        });
        setTimeout(sendLoop, delay * 1000);
      });
    }

    sendLoop();
  });
}

// Group name monitor - Start task
app.post("/api/group-monitor/start", (req, res) => {
  const { cookies, groupId, desiredGroupName } = req.body;
  if (!cookies || !groupId || !desiredGroupName) {
    return res
      .status(400)
      .json({ success: false, error: "Missing required fields." });
  }

  const parsedCookies = parseCookies(cookies);
  const appState = convertToAppState(parsedCookies);
  const deviceInfo = loadDeviceInfo();

  login(getLoginOptions(appState, deviceInfo), (err, api) => {
    if (err) {
      console.log(`\x1b[31m❌ Login failed: ${err}\x1b[0m`); // Red Error
      return res.json({
        success: false,
        error: "Login failed. Please check your cookies.",
      });
    }

    saveDeviceInfo(api);
    const uid = api.getCurrentUserID();

    loggedInUsers[uid] = {
      appState,
      type: "group",
      groupId,
      desiredGroupName,
      lastGroupName: "",
    };

    startGroupMonitor(uid, api, groupId, desiredGroupName, appState);

    res.json({ success: true, uid, message: "Group monitoring started" });
          u.uid,
      u.messages,
      u.delay,
      u.hatersName,
      u.targetUid,
      1,
      u.currentIndex
    );
  }
}

app.listen(port, () => {
  console.log(`\x1b[36m🚀 Server running at http://localhost:${port}\x1b[0m`); // Cyan Info
  resumeAllProcesses();
});
