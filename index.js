const { Client, Collection, GatewayIntentBits } = require('discord.js');
const config = require('./config.json');
const { loadEvents } = require('./handlers/eventHandler');
const { loadCommands } = require('./handlers/commandHandler');
const { loadSlashCommands } = require('./handlers/slashCommandHandler');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildBans,
        GatewayIntentBits.GuildEmojisAndStickers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildModeration
    ]
});

client.commands = new Collection();
client.slashCommands = new Collection();

(async () => {
    try {
        await loadCommands(client);
        await loadSlashCommands(client);
        await loadEvents(client);
        await client.login(config.token);
    } catch (error) {
        console.error('Error during initialization:', error);
    }
})(); 