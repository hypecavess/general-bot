module.exports = {
    name: 'ping',
    description: 'Shows the bot\'s ping',
    async execute(message, args) {
        await message.reply(`Pong! ${message.client.ws.ping}ms`);
    },
}; 