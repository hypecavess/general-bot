const fs = require('fs').promises;
const path = require('path');

class ServerManager {
    constructor() {
        this.serverDataPath = path.join(process.cwd(), '[data]', 'serverData');
        this.cache = new Map();
    }

    async ensureServerData(guildId) {
        const filePath = path.join(this.serverDataPath, `${guildId}.json`);
        
        try {
            await fs.access(filePath);
        } catch {
            const defaultData = {
                guildId,
                systems: {
                    linkBlock: {
                        enabled: false,
                        customPatterns: []
                    },
                    swearBlock: {
                        enabled: false,
                        customPatterns: []
                    },
                    adsBlock: {
                        enabled: false,
                        customPatterns: []
                    }
                }
            };

            await fs.mkdir(this.serverDataPath, { recursive: true });
            await fs.writeFile(filePath, JSON.stringify(defaultData, null, 4));
            return defaultData;
        }

        const data = JSON.parse(await fs.readFile(filePath, 'utf-8'));
        return data;
    }

    async getServerData(guildId) {
        if (!this.cache.has(guildId)) {
            const data = await this.ensureServerData(guildId);
            this.cache.set(guildId, data);
        }
        return this.cache.get(guildId);
    }

    async updateServerData(guildId, data) {
        const filePath = path.join(this.serverDataPath, `${guildId}.json`);
        await fs.writeFile(filePath, JSON.stringify(data, null, 4));
        this.cache.set(guildId, data);
    }

    async toggleSystem(guildId, system) {
        const data = await this.getServerData(guildId);
        data.systems[system].enabled = !data.systems[system].enabled;
        await this.updateServerData(guildId, data);
        return data.systems[system].enabled;
    }

    async addCustomPattern(guildId, system, pattern) {
        const data = await this.getServerData(guildId);
        if (!data.systems[system].customPatterns.includes(pattern)) {
            data.systems[system].customPatterns.push(pattern);
            await this.updateServerData(guildId, data);
            return true;
        }
        return false;
    }

    async removeCustomPattern(guildId, system, pattern) {
        const data = await this.getServerData(guildId);
        const patterns = data.systems[system].customPatterns;
        const index = patterns.indexOf(pattern);
        
        if (index !== -1) {
            patterns.splice(index, 1);
            await this.updateServerData(guildId, data);
            return true;
        }
        return false;
    }

    async isSystemEnabled(guildId, system) {
        const data = await this.getServerData(guildId);
        return data.systems[system].enabled;
    }

    async getCustomPatterns(guildId, system) {
        const data = await this.getServerData(guildId);
        return data.systems[system].customPatterns;
    }
}

module.exports = new ServerManager(); 