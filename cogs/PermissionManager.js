// ═══════════════════════════════════════════════════════════
//  PERMISSION MANAGER MODULE - MULTILANG
//  Enhanced with Multi-Language Support
// ═══════════════════════════════════════════════════════════

const { PermissionsBitField } = require('discord.js');

class PermissionManager {
    static hasSetupPerm(member, config) {
        if (config.setupPermissions.allowAdministrator && 
            member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return true;
        }
        
        if (config.setupPermissions.allowedRoles?.length > 0) {
            return member.roles.cache.some(r => config.setupPermissions.allowedRoles.includes(r.id));
        }
        
        return false;
    }

    static async checkChannelPerms(channel) {
        const bot = channel.guild.members.me;
        const perms = channel.permissionsFor(bot);
        
        const needed = [
            PermissionsBitField.Flags.ViewChannel,
            PermissionsBitField.Flags.SendMessages,
            PermissionsBitField.Flags.EmbedLinks,
            PermissionsBitField.Flags.AttachFiles,
            PermissionsBitField.Flags.ReadMessageHistory
        ];
        
        const missing = needed.filter(p => !perms.has(p));
        
        const missingNames = missing.map(flag => {
            const flagName = Object.keys(PermissionsBitField.Flags).find(
                key => PermissionsBitField.Flags[key] === flag
            );
            return flagName || 'Unknown';
        });
        
        return { 
            ok: missing.length === 0, 
            missing: missingNames,
            hasAll: missing.length === 0
        };
    }

    /**
     * Hole Liste der benötigten Permissions (mehrsprachig)
     * @param {Object} messageHandler - MessageHandler Instanz (optional)
     * @param {Object} gcfg - Guild Config (optional)
     * @returns {Array} Liste mit {flag, name}
     */
    static getPermissionsList(messageHandler = null, gcfg = null) {
        return [
            { 
                flag: PermissionsBitField.Flags.ViewChannel, 
                name: messageHandler 
                    ? messageHandler.get('permissions.list.viewChannel', {}, null, gcfg)
                    : '👁️ Kanal ansehen'
            },
            { 
                flag: PermissionsBitField.Flags.SendMessages, 
                name: messageHandler
                    ? messageHandler.get('permissions.list.sendMessages', {}, null, gcfg)
                    : '💬 Nachrichten senden'
            },
            { 
                flag: PermissionsBitField.Flags.EmbedLinks, 
                name: messageHandler
                    ? messageHandler.get('permissions.list.embedLinks', {}, null, gcfg)
                    : '🔗 Embeds verwenden'
            },
            { 
                flag: PermissionsBitField.Flags.AttachFiles, 
                name: messageHandler
                    ? messageHandler.get('permissions.list.attachFiles', {}, null, gcfg)
                    : '📁 Dateien anhängen'
            },
            { 
                flag: PermissionsBitField.Flags.ReadMessageHistory, 
                name: messageHandler
                    ? messageHandler.get('permissions.list.readMessageHistory', {}, null, gcfg)
                    : '📜 Nachrichtenverlauf lesen'
            }
        ];
    }

    /**
     * Formatiere fehlende Permissions (mehrsprachig)
     * @param {Array} missing - Liste der fehlenden Permissions
     * @param {Object} messageHandler - MessageHandler Instanz (optional)
     * @param {Object} gcfg - Guild Config (optional)
     * @returns {String} Formatierter Text
     */
    static formatMissingPerms(missing, messageHandler = null, gcfg = null) {
        // Keine fehlenden Permissions
        if (missing.length === 0) {
            return messageHandler
                ? messageHandler.get('commands.checkperms.title.allPermissions', {}, null, gcfg)
                : '✅ Alle Berechtigungen vorhanden';
        }
        
        const permList = this.getPermissionsList(messageHandler, gcfg);
        const formatted = missing.map(m => {
            const perm = permList.find(p => {
                const flagName = Object.keys(PermissionsBitField.Flags).find(
                    key => PermissionsBitField.Flags[key] === p.flag
                );
                return flagName === m;
            });
            return perm ? perm.name : `❌ ${m}`;
        });
        
        // Header für fehlende Permissions
        const header = messageHandler
            ? messageHandler.get('commands.checkperms.title.missingPermissions', {}, null, gcfg)
            : '❌ Fehlende Berechtigungen:';
        
        return `${header}\n${formatted.join('\n')}`;
    }
}

module.exports = { PermissionManager };