const fs = require('fs').promises;
const path = require('path');

class DataManager {
    constructor() {
        this.dataPath = path.join(process.cwd(), '[data]', 'systemData');
        this.cache = new Map();
    }

    async loadData(type) {
        try {
            const filePath = path.join(this.dataPath, `${type}.txt`);
            const data = await fs.readFile(filePath, 'utf-8');
            
            const patterns = data
                .split('\n')
                .map(line => line.trim())
                .filter(line => line && line.length > 0);

            console.log(`Loaded ${type} patterns:`, patterns);
            this.cache.set(type, patterns);
            return patterns;
        } catch (error) {
            console.error(`Error loading ${type} data:`, error);
            return [];
        }
    }

    async saveData(type, patterns) {
        try {
            const cleanPatterns = patterns
                .map(p => p.trim())
                .filter(p => p && p.length > 0);

            const filePath = path.join(this.dataPath, `${type}.txt`);
            await fs.writeFile(filePath, cleanPatterns.join('\n'));
            this.cache.set(type, cleanPatterns);
        } catch (error) {
            console.error(`Error saving ${type} data:`, error);
        }
    }

    async getPatterns(type) {
        if (!this.cache.has(type)) {
            await this.loadData(type);
        }
        const patterns = this.cache.get(type) || [];
        return patterns;
    }

    clearCache() {
        this.cache.clear();
    }
}

module.exports = new DataManager(); 