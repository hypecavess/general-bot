const fs = require('fs').promises;
const path = require('path');

async function loadEvents(client) {
    try {
        const eventsPath = path.join(process.cwd(), 'events');
        const eventFolders = await fs.readdir(eventsPath);

        for (const folder of eventFolders) {
            const folderPath = path.join(eventsPath, folder);
            const stat = await fs.stat(folderPath);
            
            if (!stat.isDirectory()) continue;

            const eventFiles = (await fs.readdir(folderPath)).filter(file => file.endsWith('.js'));

            for (const file of eventFiles) {
                const filePath = path.join(folderPath, file);
                const event = require(filePath);

                if ('name' in event && 'execute' in event) {
                    if (event.once) {
                        client.once(event.name, (...args) => event.execute(...args));
                    } else {
                        client.on(event.name, (...args) => event.execute(...args));
                    }
                }
            }
        }
    } catch (error) {
        console.error('Error loading events:', error);
    }
}

module.exports = { loadEvents };