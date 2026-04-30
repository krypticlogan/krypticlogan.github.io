import http from "node:http";
import { exec } from "node:child_process";

const clientId = process.env.SPOTIFY_CLIENT_ID;
const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
const port = 8000;
const redirectUri = `http://127.0.0.1:${port}/`;
const scope =
  "user-read-currently-playing user-read-playback-state user-top-read";

if (!clientId || !clientSecret) {
  console.error(
    "Missing SPOTIFY_CLIENT_ID or SPOTIFY_CLIENT_SECRET in your environment.",
  );
  process.exit(1);
}

const authUrl = new URL("https://accounts.spotify.com/authorize");
authUrl.searchParams.set("client_id", clientId);
authUrl.searchParams.set("response_type", "code");
authUrl.searchParams.set("redirect_uri", redirectUri);
authUrl.searchParams.set("scope", scope);

authUrl.searchParams.set("show_dialog", "true");

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, redirectUri);
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");

  if (error) {
    res.writeHead(400, { "Content-Type": "text/plain" });
    res.end(`Authorization error: ${error}`);
    server.close();
    return;
  }

  if (!code) {
    res.writeHead(400, { "Content-Type": "text/plain" });
    res.end("Missing authorization code.");
    server.close();
    return;
  }

  const tokenResponse = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
    }),
  });

  if (!tokenResponse.ok) {
    const body = await tokenResponse.text();
    res.writeHead(500, { "Content-Type": "text/plain" });
    res.end(`Token exchange failed: ${body}`);
    server.close();
    return;
  }

  const data = await tokenResponse.json();
  const refreshToken = data.refresh_token;

  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end(
    refreshToken
      ? `Refresh token:\n${refreshToken}\n\nYou can close this tab now.`
      : "No refresh token returned. If you already authorized this app, revoke access and retry.",
  );

  if (refreshToken) {
    console.log("Refresh token:", refreshToken);
  }

  server.close();
});

server.listen(port, () => {
  console.log(`Listening on ${redirectUri}`);
  console.log(`Open this URL to authorize:\n${authUrl.toString()}`);

  const opener =
    process.platform === "win32"
      ? "start"
      : process.platform === "darwin"
        ? "open"
        : "xdg-open";
  exec(`${opener} "${authUrl.toString()}"`, (err) => {
    if (err) {
      console.log("Open the URL above in your browser.");
    }
  });
});
