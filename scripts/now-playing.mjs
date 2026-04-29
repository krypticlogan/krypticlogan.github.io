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
    "https://api.spotify.com/v1/me/player/currently-playing?additional_types=track,episode",
    {
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
    },
);

if (nowResponse.status === 204) {
    const outputPath = path.resolve(process.cwd(), "now-playing.json");
    await fs.writeFile(outputPath, `${JSON.stringify(output, null, 2)}\n`, "utf8");
    process.exit(0);
}

if (!nowResponse.ok) {
    const errorText = await nowResponse.text();
    output.error = `Spotify now-playing request failed (${nowResponse.status}): ${errorText}`;
    const outputPath = path.resolve(process.cwd(), "now-playing.json");
    await fs.writeFile(outputPath, `${JSON.stringify(output, null, 2)}\n`, "utf8");
    process.exit(0);
}

const nowData = await nowResponse.json();

if (nowData?.item) {
    const item = nowData.item;
    const isTrack = item.type === "track";
    const isEpisode = item.type === "episode";

    output = {
        isPlaying: Boolean(nowData.is_playing),
        type: item.type,
        title: item.name,
        artist: isTrack
            ? item.artists?.map((artist) => artist.name).join(", ")
            : isEpisode
              ? item.show?.name
              : undefined,
        album: isTrack ? item.album?.name : isEpisode ? item.show?.name : undefined,
        url: item.external_urls?.spotify,
        cover: isTrack
            ? item.album?.images?.[0]?.url
            : isEpisode
              ? item.images?.[0]?.url
              : undefined,
        updatedAt: new Date().toISOString(),
    };
}

const outputPath = path.resolve(process.cwd(), "now-playing.json");
await fs.writeFile(outputPath, `${JSON.stringify(output, null, 2)}\n`, "utf8");
