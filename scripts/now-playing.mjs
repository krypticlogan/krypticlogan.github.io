import fs from "node:fs/promises";
import path from "node:path";

const {
  SPOTIFY_CLIENT_ID: clientId,
  SPOTIFY_CLIENT_SECRET: clientSecret,
  SPOTIFY_REFRESH_TOKEN: refreshToken,
} = process.env;

if (!clientId || !clientSecret || !refreshToken) {
  console.error(
    "Missing Spotify credentials. Set SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, and SPOTIFY_REFRESH_TOKEN.",
  );
  process.exit(1);
}

const tokenResponse = await fetch("https://accounts.spotify.com/api/token", {
  method: "POST",
  headers: {
    Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
    "Content-Type": "application/x-www-form-urlencoded",
  },
  body: new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  }),
});

if (!tokenResponse.ok) {
  const errorText = await tokenResponse.text();
  console.error("Spotify token request failed:", errorText);
  process.exit(1);
}

const tokenData = await tokenResponse.json();
const accessToken = tokenData.access_token;

let output = {
  isPlaying: false,
  updatedAt: new Date().toISOString(),
};

const nowResponse = await fetch(
  "https://api.spotify.com/v1/me/player/currently-playing?additional_types=track",
  {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  },
);

if (nowResponse.status !== 204 && nowResponse.ok) {
  const nowData = await nowResponse.json();
  const item = nowData?.item;

  if (item) {
    output = {
      isPlaying: Boolean(nowData.is_playing),
      type: item.type,
      title: item.name,
      artist: item.artists?.map((artist) => artist.name).join(", "),
      album: item.album?.name,
      url: item.external_urls?.spotify,
      cover: item.album?.images?.[0]?.url,
      updatedAt: new Date().toISOString(),
    };

    const outputPath = path.resolve(process.cwd(), "now-playing.json");
    await fs.writeFile(
      outputPath,
      `${JSON.stringify(output, null, 2)}\n`,
      "utf8",
    );
    process.exit(0);
  }
}

const topResponse = await fetch(
  "https://api.spotify.com/v1/me/top/tracks?time_range=short_term&limit=1",
  {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  },
);

if (!topResponse.ok) {
  const errorText = await topResponse.text();
  output.error = `Spotify top-tracks request failed (${topResponse.status}): ${errorText}`;
  const outputPath = path.resolve(process.cwd(), "now-playing.json");
  await fs.writeFile(
    outputPath,
    `${JSON.stringify(output, null, 2)}\n`,
    "utf8",
  );
  process.exit(0);
}

const topData = await topResponse.json();
const topItem = topData?.items?.[0];

if (topItem) {
  output = {
    isPlaying: false,
    type: topItem.type,
    title: topItem.name,
    artist: topItem.artists?.map((artist) => artist.name).join(", "),
    album: topItem.album?.name,
    url: topItem.external_urls?.spotify,
    cover: topItem.album?.images?.[0]?.url,
    updatedAt: new Date().toISOString(),
  };
}

const outputPath = path.resolve(process.cwd(), "now-playing.json");
await fs.writeFile(outputPath, `${JSON.stringify(output, null, 2)}\n`, "utf8");
