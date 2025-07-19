const { REST, Routes } = require('discord.js');
const fs = require('fs').promises;
const path = require('path');

async function loadSlashCommands(client) {
    try {
        const slashCommands = [];
        const commandsPath = path.join(process.cwd(), 'commands', 'slash');
        const commandFiles = (await fs.readdir(commandsPath)).filter(file => file.endsWith('.js'));

        for (const file of commandFiles) {
            const filePath = path.join(commandsPath, file);
            const command = require(filePath);

            if ('data' in command && 'execute' in command) {
                client.slashCommands.set(command.data.name, command);
                slashCommands.push(command.data.toJSON());
            } else {
            }
        }


        client.once('ready', async () => {
            try {
                const rest = new REST().setToken(client.token);
                await rest.put(
                    Routes.applicationCommands(client.user.id),
                    { body: slashCommands }
                );
            } catch (error) {
            }
        });
    } catch (error) {
        console.error('Error loading slash commands:', error);
    }
}

module.exports = { loadSlashCommands };
