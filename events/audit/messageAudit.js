const auditLogger = require('../../utils/auditLogger');

module.exports = {
    name: 'ready',
    once: true,
    async execute(client) {
        client.on('messageUpdate', async (oldMessage, newMessage) => {
            if (oldMessage.author?.bot || oldMessage.content === newMessage.content) return;

            await auditLogger.sendLog(client, 'message', {
                action: 'update',
                author: oldMessage.author,
                channel: oldMessage.channel,
                oldContent: oldMessage.content,
                newContent: newMessage.content
            });
        });

        client.on('messageDelete', async message => {
            if (message.author?.bot) return;

            const auditLog = await message.guild.fetchAuditLogs({
                type: 'MESSAGE_DELETE',
                limit: 1
            }).then(audit => audit.entries.first());

            const deletedBy = auditLog?.executor?.id === message.author?.id ? null : auditLog?.executor;

            await auditLogger.sendLog(client, 'message', {
                action: 'delete',
                author: message.author,
                channel: message.channel,
                content: message.content,
                deletedBy: deletedBy
            });
        });

        client.on('messageDeleteBulk', async messages => {
            const auditLog = await messages.first().guild.fetchAuditLogs({
                type: 'MESSAGE_BULK_DELETE',
                limit: 1
            }).then(audit => audit.entries.first());

            const messageCount = messages.size;
            const channel = messages.first().channel;
            const deletedBy = auditLog?.executor;

            await auditLogger.sendLog(client, 'message', {
                action: 'bulk_delete',
                channel: channel,
                count: messageCount,
                deletedBy: deletedBy
            });
        });
    }
}; 