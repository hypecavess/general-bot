const auditLogger = require('../../utils/auditLogger');

module.exports = {
    name: 'ready',
    once: true,
    async execute(client) {
        client.on('guildUpdate', async (oldGuild, newGuild) => {
            const changes = {};

            if (oldGuild.name !== newGuild.name) {
                changes.name = { old: oldGuild.name, new: newGuild.name };
            }

            if (oldGuild.icon !== newGuild.icon) {
                changes.icon = { old: oldGuild.iconURL(), new: newGuild.iconURL() };
            }

            if (oldGuild.banner !== newGuild.banner) {
                changes.banner = { old: oldGuild.bannerURL(), new: newGuild.bannerURL() };
            }

            if (oldGuild.verificationLevel !== newGuild.verificationLevel) {
                changes.verificationLevel = { old: oldGuild.verificationLevel, new: newGuild.verificationLevel };
            }

            if (oldGuild.explicitContentFilter !== newGuild.explicitContentFilter) {
                changes.explicitContentFilter = { old: oldGuild.explicitContentFilter, new: newGuild.explicitContentFilter };
            }

            if (Object.keys(changes).length > 0) {
                await auditLogger.sendLog(client, 'server', {
                    action: 'update',
                    changes: changes
                });
            }
        });

        client.on('emojiCreate', async emoji => {
            await auditLogger.sendLog(client, 'server', {
                action: 'emoji_create',
                emoji: emoji
            });
        });

        client.on('emojiUpdate', async (oldEmoji, newEmoji) => {
            await auditLogger.sendLog(client, 'server', {
                action: 'emoji_update',
                emoji: newEmoji,
                oldName: oldEmoji.name,
                newName: newEmoji.name
            });
        });

        client.on('emojiDelete', async emoji => {
            await auditLogger.sendLog(client, 'server', {
                action: 'emoji_delete',
                name: emoji.name
            });
        });

        client.on('channelCreate', async channel => {
            if (!channel.guild) return;

            await auditLogger.sendLog(client, 'channel', {
                action: 'create',
                channel: channel,
                type: channel.type,
                category: channel.parent?.name
            });
        });

        client.on('channelUpdate', async (oldChannel, newChannel) => {
            if (!newChannel.guild) return;

            const changes = {};

            if (oldChannel.name !== newChannel.name) {
                changes.name = { old: oldChannel.name, new: newChannel.name };
            }

            if ('topic' in oldChannel && oldChannel.topic !== newChannel.topic) {
                changes.topic = { old: oldChannel.topic || 'None', new: newChannel.topic || 'None' };
            }

            const oldPermissions = oldChannel.permissionOverwrites.cache;
            const newPermissions = newChannel.permissionOverwrites.cache;
            if (oldPermissions.size !== newPermissions.size) {
                changes.permissions = { old: 'Previous permissions', new: 'Updated permissions' };
            }

            if (Object.keys(changes).length > 0) {
                await auditLogger.sendLog(client, 'channel', {
                    action: 'update',
                    channel: newChannel,
                    changes: changes
                });
            }
        });

        client.on('channelDelete', async channel => {
            if (!channel.guild) return;

            await auditLogger.sendLog(client, 'channel', {
                action: 'delete',
                name: channel.name,
                type: channel.type
            });
        });

        client.on('roleCreate', async role => {
            await auditLogger.sendLog(client, 'role', {
                action: 'create',
                role: role
            });
        });

        client.on('roleUpdate', async (oldRole, newRole) => {
            const changes = {};

            if (oldRole.name !== newRole.name) {
                changes.name = { old: oldRole.name, new: newRole.name };
            }

            if (oldRole.color !== newRole.color) {
                changes.color = { old: oldRole.hexColor, new: newRole.hexColor };
            }

            if (oldRole.permissions.bitfield !== newRole.permissions.bitfield) {
                changes.permissions = { old: 'Previous permissions', new: 'Updated permissions' };
            }

            if (oldRole.position !== newRole.position) {
                changes.position = { old: oldRole.position, new: newRole.position };
            }

            if (Object.keys(changes).length > 0) {
                await auditLogger.sendLog(client, 'role', {
                    action: 'update',
                    role: newRole,
                    changes: changes
                });
            }
        });

        client.on('roleDelete', async role => {
            await auditLogger.sendLog(client, 'role', {
                action: 'delete',
                name: role.name,
                color: role.hexColor,
                position: role.position
            });
        });
    }
}; 