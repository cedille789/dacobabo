const { Client, Events, GatewayIntentBits, Message, MessageReaction } = require("discord.js");
const Dokdo = require("dokdo");
const Hangul = require("hangul-js");
const { token, threads } = require("./config.json");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageTyping,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.MessageContent,
  ],
});
const DokdoHandler = new Dokdo.Client(client, { aliases: ["dokdo", "dok"], prefix: "!" });

client.once(Events.ClientReady, (readyClient) => {
  console.log(`Ready! Logged in as ${readyClient.user.tag}`);

  readyClient.user.setPresence({ activities: [{ name: "한글 8번째 닿소리 글자 찾기" }] });
});

/**@type {Map<string, { react: MessageReaction, reply: Message }>} */
const messages = new Map();

client.on(Events.MessageCreate, async (message) => {
  if (message.author.bot) return;

  if (threads.includes(message.channelId) && (await hasIeung(message.content))) {
    const react = await message.react("❌");
    const reply = await message.reply(
      "한글 8번째 닿소리 글자 금지!!! <:nuong:1106590272361603133>"
    );
    messages.set(message.id, { react, reply });
  }

  if (message.content.endsWith("바보")) return message.reply(":rofl:");
  if (message.content == "모하지") return message.channel.send("공화국");

  DokdoHandler.run(message);
});

client.on(Events.MessageUpdate, async (message, newMessage) => {
  if (threads.includes(message.channelId)) {
    if (messages.has(message.id)) {
      if (!(await hasIeung(newMessage.content))) {
        const msg = messages.get(message.id);
        msg.react.users.remove(client.user);
        msg.reply.delete();
        return;
      }
    } else {
      if (await hasIeung(newMessage.content)) {
        const react = await newMessage.react("❌");
        const reply = await newMessage.reply(
          "한글 8번째 닿소리 글자 금지!!! <:nuong:1106590272361603133>"
        );
        messages.set(newMessage.id, { react, reply });
        return;
      }
    }
  }
});

client.on(Events.MessageDelete, (message) => {
  if (threads.includes(message.channelId) && messages.has(message.id)) {
    const msg = messages.get(message.id);
    msg.reply.delete();
  }
});

/**
 * @param {string} string
 */
async function hasIeung(string) {
  return Hangul.disassemble(string).includes("ㅇ") || /[ᄋᆼ]/.test(string);
}

client.login(token);
