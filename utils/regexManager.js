const dataManager = require('./dataManager');

class RegexManager {
    constructor() {
        this.regexCache = new Map();
    }

    escapeRegExp(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    async buildRegexPattern(type) {
        const patterns = await dataManager.getPatterns(type);
        if (patterns.length === 0) return null;

        const escapedPatterns = patterns.map(pattern => this.escapeRegExp(pattern));
        
        try {
            const regexPattern = new RegExp(escapedPatterns.join('|'), 'gi');
            this.regexCache.set(type, regexPattern);
            return regexPattern;
        } catch (error) {
            console.error(`Error building regex for ${type}:`, error);
            return null;
        }
    }

    async getRegexPattern(type) {
        if (!this.regexCache.has(type)) {
            await this.buildRegexPattern(type);
        }
        return this.regexCache.get(type);
    }

    async checkContent(type, content) {
        const regex = await this.getRegexPattern(type);
        if (!regex) return false;

        return regex.test(content);
    }

    async findMatches(type, content) {
        const regex = await this.getRegexPattern(type);
        if (!regex) return [];

        return [...content.matchAll(regex)].map(match => ({
            match: match[0],
            index: match.index
        }));
    }
}

module.exports = new RegexManager(); 