const fs = require('fs').promises;
const path = require('path');

async function loadCommands(client) {
    try {
        const commandsPath = path.join(process.cwd(), 'commands', 'prefix');
        const commandFiles = (await fs.readdir(commandsPath)).filter(file => file.endsWith('.js'));

        for (const file of commandFiles) {
            const filePath = path.join(commandsPath, file);
            const command = require(filePath);

            if ('name' in command && 'execute' in command) {
                client.commands.set(command.name, command);
            } else {
            }
        }

    } catch (error) {
        console.error('Error loading prefix commands:', error);
    }
}

module.exports = { loadCommands };
