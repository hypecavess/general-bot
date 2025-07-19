const auditLogger = require('../../utils/auditLogger');

module.exports = {
    name: 'ready',
    once: true,
    async execute(client) {
        client.on('guildMemberAdd', async member => {
            await auditLogger.sendLog(client, 'member', {
                action: 'join',
                member: member
            });
        });

        client.on('guildMemberRemove', async member => {
            await auditLogger.sendLog(client, 'member', {
                action: 'leave',
                member: member
            });
        });

        client.on('guildMemberUpdate', async (oldMember, newMember) => {
            if (oldMember.nickname !== newMember.nickname) {
                await auditLogger.sendLog(client, 'member', {
                    action: 'nickname',
                    member: newMember,
                    oldNick: oldMember.nickname,
                    newNick: newMember.nickname
                });
            }

            const addedRoles = newMember.roles.cache
                .filter(role => !oldMember.roles.cache.has(role.id))
                .map(role => role.toString());

            const removedRoles = oldMember.roles.cache
                .filter(role => !newMember.roles.cache.has(role.id))
                .map(role => role.toString());

            if (addedRoles.length > 0 || removedRoles.length > 0) {
                await auditLogger.sendLog(client, 'member', {
                    action: 'roles',
                    member: newMember,
                    added: addedRoles,
                    removed: removedRoles
                });
            }
        });

        client.on('guildBanAdd', async ban => {
            const auditLog = await ban.guild.fetchAuditLogs({
                type: 'MEMBER_BAN_ADD',
                limit: 1
            }).then(audit => audit.entries.first());

            await auditLogger.sendLog(client, 'moderator', {
                action: 'ban',
                member: ban.user,
                moderator: auditLog?.executor || 'Unknown',
                reason: ban.reason || auditLog?.reason
            });
        });

        client.on('guildBanRemove', async ban => {
            const auditLog = await ban.guild.fetchAuditLogs({
                type: 'MEMBER_BAN_REMOVE',
                limit: 1
            }).then(audit => audit.entries.first());

            await auditLogger.sendLog(client, 'moderator', {
                action: 'unban',
                member: ban.user,
                moderator: auditLog?.executor || 'Unknown',
                reason: auditLog?.reason
            });
        });

        client.on('guildAuditLogEntryCreate', async auditLog => {
            if (auditLog.action === 'MEMBER_UPDATE' && auditLog.changes.some(change => change.key === 'communication_disabled_until')) {
                const change = auditLog.changes.find(c => c.key === 'communication_disabled_until');
                const member = await auditLog.guild.members.fetch(auditLog.target.id).catch(() => null);
                if (!member) return;

                if (change.new) {
                    const duration = new Date(change.new) - new Date();
                    const durationText = this.formatDuration(duration);

                    await auditLogger.sendLog(client, 'moderator', {
                        action: 'timeout',
                        member: member,
                        moderator: auditLog.executor,
                        duration: durationText,
                        reason: auditLog.reason
                    });
                } else {
                    await auditLogger.sendLog(client, 'moderator', {
                        action: 'untimeout',
                        member: member,
                        moderator: auditLog.executor,
                        reason: auditLog.reason
                    });
                }
            }
        });
    },

    formatDuration(ms) {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        const parts = [];
        if (days > 0) parts.push(`${days} day${days !== 1 ? 's' : ''}`);
        if (hours % 24 > 0) parts.push(`${hours % 24} hour${hours % 24 !== 1 ? 's' : ''}`);
        if (minutes % 60 > 0) parts.push(`${minutes % 60} minute${minutes % 60 !== 1 ? 's' : ''}`);
        if (seconds % 60 > 0) parts.push(`${seconds % 60} second${seconds % 60 !== 1 ? 's' : ''}`);

        return parts.join(', ');
    }
}; 