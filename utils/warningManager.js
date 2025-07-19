const fs = require('fs').promises;
const path = require('path');
const config = require('../config.json');

class WarningManager {
    constructor() {
        this.userDataPath = path.join(process.cwd(), '[data]', 'userData');
        this.warnings = new Map();
    }

    async getGuildWarningsPath(guildId) {
        const guildPath = path.join(this.userDataPath, guildId);
        const warningsPath = path.join(guildPath, 'warnings');
        
        await fs.mkdir(guildPath, { recursive: true });
        await fs.mkdir(warningsPath, { recursive: true });
        
        return warningsPath;
    }

    async getUserWarningsPath(guildId, userId) {
        const warningsPath = await this.getGuildWarningsPath(guildId);
        return path.join(warningsPath, `${userId}.json`);
    }

    async loadUserWarnings(guildId, userId) {
        try {
            const filePath = await this.getUserWarningsPath(guildId, userId);
            const data = await fs.readFile(filePath, 'utf-8');
            return JSON.parse(data);
        } catch {
            return { warnings: [] };
        }
    }

    async saveUserWarnings(guildId, userId, userData) {
        try {
            const filePath = await this.getUserWarningsPath(guildId, userId);
            await fs.writeFile(filePath, JSON.stringify(userData, null, 2));
        } catch (error) {
            console.error('Error saving user warnings:', error);
        }
    }

    async getWarnings(guildId, userId) {
        const userData = await this.loadUserWarnings(guildId, userId);
        
        const now = Date.now();
        const resetTime = config.moderationSettings.warningLimits.resetWarningsAfter;
        const activeWarnings = userData.warnings.filter(w => (now - w.timestamp) < resetTime);

        if (activeWarnings.length !== userData.warnings.length) {
            userData.warnings = activeWarnings;
            await this.saveUserWarnings(guildId, userId, userData);
        }

        return activeWarnings;
    }

    async addWarning(guildId, userId, reason) {
        const userData = await this.loadUserWarnings(guildId, userId);
        
        const warning = {
            timestamp: Date.now(),
            reason: reason
        };

        userData.warnings.push(warning);
        await this.saveUserWarnings(guildId, userId, userData);

        const activeWarnings = await this.getWarnings(guildId, userId);
        return {
            count: activeWarnings.length,
            shouldTimeout: activeWarnings.length >= config.moderationSettings.warningLimits.maxWarnings
        };
    }

    async clearWarnings(guildId, userId) {
        await this.saveUserWarnings(guildId, userId, { warnings: [] });
    }

    async getAllUserWarnings(guildId) {
        try {
            const warningsPath = await this.getGuildWarningsPath(guildId);
            const files = await fs.readdir(warningsPath);
            
            const allWarnings = {};
            for (const file of files) {
                if (file.endsWith('.json')) {
                    const userId = file.replace('.json', '');
                    const warnings = await this.getWarnings(guildId, userId);
                    if (warnings.length > 0) {
                        allWarnings[userId] = warnings;
                    }
                }
            }
            
            return allWarnings;
        } catch (error) {
            console.error('Error getting all user warnings:', error);
            return {};
        }
    }

    async deleteExpiredWarnings(guildId) {
        try {
            const warningsPath = await this.getGuildWarningsPath(guildId);
            const files = await fs.readdir(warningsPath);
            
            for (const file of files) {
                if (file.endsWith('.json')) {
                    const userId = file.replace('.json', '');
                    await this.getWarnings(guildId, userId);
                }
            }
        } catch (error) {
            console.error('Error cleaning expired warnings:', error);
        }
    }
}

module.exports = new WarningManager();