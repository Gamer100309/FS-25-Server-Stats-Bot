// ═══════════════════════════════════════════════════════════
//  STATE MANAGER MODULE
// ═══════════════════════════════════════════════════════════

const fs = require('fs');
const path = require('path');

class StateManager {
    constructor(guildId) {
        this.file = path.join('./states', `guild_${guildId}.json`);
        this.state = this.load();
    }

    load() {
        try {
            if (fs.existsSync(this.file)) {
                return JSON.parse(fs.readFileSync(this.file, 'utf8'));
            }
        } catch (e) {}
        return { servers: {} };
    }

    save() {
        try {
            fs.writeFileSync(this.file, JSON.stringify(this.state, null, 2));
        } catch (e) {}
    }

    get(channelID) {
        return this.state.servers[channelID] || null;
    }

    set(channelID, messageID, lastStatus) {
        if (!this.state.servers[channelID]) this.state.servers[channelID] = {};
        this.state.servers[channelID].messageID = messageID;
        this.state.servers[channelID].lastStatus = lastStatus;
        this.state.servers[channelID].lastUpdate = new Date().toISOString();
        this.save();
    }
}

module.exports = { StateManager };