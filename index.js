import "dotenv/config";
import discord from "discord.js";
import ytdl from "ytdl-core";

const { URL, CHANNELID, TOKEN } = process.env;
const client = new discord.Client();

let broadcast = null;
let interval = null;

if (!TOKEN) {
  console.error("Invalid token, please use a valid one!");
  process.exit(1);
} else if (!CHANNELID || Number(CHANNELID) == NaN) {
  console.log("Wrong ID");
  process.exit(1);
} else if (!ytdl.validateURL(URL)) {
  console.log("Incorrect URL");
  process.exit(1);
}

client.on("ready", async () => {
  client.user.setActivity("Coding with Lo-fi");
  let channel =
    client.channels.cache.get(CHANNELID) ||
    (await client.channels.fetch(CHANNELID));

  if (!channel) {
    console.error("Channel does not exist");
    return process.exit(1);
  } else if (channel.type !== "voice") {
    console.error("Not a voice CHANNELID! Please change it");
    return process.exit(1);
  }

  broadcast = client.voice.createBroadcast();
  let stream = ytdl(URL);
  stream.on("error", console.error);
  broadcast.play(stream);
  if (!interval) {
    interval = setInterval(async function () {
      try {
        if (stream && !stream.ended) stream.destroy();
        stream = ytdl(URL, { highWaterMark: 100 << 150 });
        stream.on("error", console.error);
        broadcast.play(stream);
      } catch (e) {
        return;
      }
    }, 1800000);
  }
  try {
    const connection = await channel.join();
    connection.play(broadcast);
  } catch (error) {
    console.error(error);
  }
});

setInterval(async function () {
  if (!client.voice.connections.size) {
    let channel =
      client.channels.cache.get(CHANNELID) ||
      (await client.channels.fetch(CHANNELID));
    if (!channel) return;
    try {
      const connection = await channel.join();
      connection.play(broadcast);
    } catch (error) {
      console.error(error);
    }
  }
}, 20000);

client.login(TOKEN);

process.on("unhandledRejection", console.error);
