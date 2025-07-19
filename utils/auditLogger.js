const { EmbedBuilder } = require('discord.js');
const config = require('../config.json');

class AuditLogger {
    constructor() {
        this.config = config.auditLog;
    }

    async sendLog(client, type, data) {
        if (!this.config.enabled) return;

        const channelId = this.config.channels[type];
        if (!channelId) return;

        const channel = await client.channels.fetch(channelId).catch(() => null);
        if (!channel) return;

        const embed = this.createEmbed(type, data);
        if (!embed) return;

        await channel.send({ embeds: [embed] }).catch(console.error);
    }

    createEmbed(type, data) {
        const embed = new EmbedBuilder()
            .setColor(this.getColor(data.action))
            .setTimestamp();

        switch (type) {
            case 'member': {
                switch (data.action) {
                    case 'join':
                        embed
                            .setTitle('Member Joined')
                            .setDescription(`${data.member} joined the server.`)
                            .addFields(
                                { name: 'Account Created', value: `<t:${Math.floor(data.member.user.createdTimestamp / 1000)}:R>` }
                            );
                        break;
                    case 'leave':
                        embed
                            .setTitle('Member Left')
                            .setDescription(`${data.member.user.tag} left the server.`);
                        break;
                    case 'nickname':
                        embed
                            .setTitle('Nickname Updated')
                            .setDescription(`${data.member}'s nickname was updated.`)
                            .addFields(
                                { name: 'Old Nickname', value: data.oldNick || 'None' },
                                { name: 'New Nickname', value: data.newNick || 'None' }
                            );
                        break;
                    case 'roles':
                        embed
                            .setTitle('Member Roles Updated')
                            .setDescription(`${data.member}'s roles were updated.`)
                            .addFields(
                                { name: 'Added Roles', value: data.added.join(', ') || 'None' },
                                { name: 'Removed Roles', value: data.removed.join(', ') || 'None' }
                            );
                        break;
                }
                break;
            }

            case 'moderator': {
                switch (data.action) {
                    case 'timeout':
                        embed
                            .setTitle('Member Timed Out')
                            .setDescription(`${data.moderator} timed out ${data.member}`)
                            .addFields(
                                { name: 'Duration', value: data.duration },
                                { name: 'Reason', value: data.reason || 'No reason provided' }
                            );
                        break;
                    case 'untimeout':
                        embed
                            .setTitle('Member Timeout Removed')
                            .setDescription(`${data.moderator} removed timeout from ${data.member}`)
                            .addFields(
                                { name: 'Reason', value: data.reason || 'No reason provided' }
                            );
                        break;
                    case 'ban':
                        embed
                            .setTitle('Member Banned')
                            .setDescription(`${data.moderator} banned ${data.member}`)
                            .addFields(
                                { name: 'Reason', value: data.reason || 'No reason provided' }
                            );
                        break;
                    case 'unban':
                        embed
                            .setTitle('Member Unbanned')
                            .setDescription(`${data.moderator} unbanned ${data.member}`)
                            .addFields(
                                { name: 'Reason', value: data.reason || 'No reason provided' }
                            );
                        break;
                    case 'kick':
                        embed
                            .setTitle('Member Kicked')
                            .setDescription(`${data.moderator} kicked ${data.member}`)
                            .addFields(
                                { name: 'Reason', value: data.reason || 'No reason provided' }
                            );
                        break;
                }
                break;
            }

            case 'message': {
                switch (data.action) {
                    case 'update':
                        embed
                            .setTitle('Message Updated')
                            .setDescription(`Message by ${data.author} was edited in ${data.channel}`)
                            .addFields(
                                { name: 'Before', value: data.oldContent || 'Unable to fetch old content' },
                                { name: 'After', value: data.newContent }
                            );
                        break;
                    case 'delete':
                        embed
                            .setTitle('Message Deleted')
                            .setDescription(`Message by ${data.author} was deleted in ${data.channel}`)
                            .addFields(
                                { name: 'Content', value: data.content || 'Unable to fetch content' }
                            );
                        break;
                }
                break;
            }

            case 'server': {
                switch (data.action) {
                    case 'update':
                        embed
                            .setTitle('Server Updated')
                            .setDescription('Server settings were updated.')
                            .addFields(
                                Object.entries(data.changes).map(([field, value]) => ({
                                    name: field,
                                    value: `${value.old} → ${value.new}`
                                }))
                            );
                        break;
                    case 'emoji_create':
                        embed
                            .setTitle('Emoji Created')
                            .setDescription(`New emoji ${data.emoji} was created.`);
                        break;
                    case 'emoji_update':
                        embed
                            .setTitle('Emoji Updated')
                            .setDescription(`Emoji ${data.emoji} was updated.`)
                            .addFields(
                                { name: 'Old Name', value: data.oldName },
                                { name: 'New Name', value: data.newName }
                            );
                        break;
                    case 'emoji_delete':
                        embed
                            .setTitle('Emoji Deleted')
                            .setDescription(`Emoji ${data.name} was deleted.`);
                        break;
                }
                break;
            }

            case 'channel': {
                switch (data.action) {
                    case 'create':
                        embed
                            .setTitle('Channel Created')
                            .setDescription(`Channel ${data.channel} was created.`)
                            .addFields(
                                { name: 'Type', value: data.type },
                                { name: 'Category', value: data.category || 'None' }
                            );
                        break;
                    case 'update':
                        embed
                            .setTitle('Channel Updated')
                            .setDescription(`Channel ${data.channel} was updated.`)
                            .addFields(
                                Object.entries(data.changes).map(([field, value]) => ({
                                    name: field,
                                    value: `${value.old} → ${value.new}`
                                }))
                            );
                        break;
                    case 'delete':
                        embed
                            .setTitle('Channel Deleted')
                            .setDescription('A channel was deleted.')
                            .addFields(
                                { name: 'Name', value: data.name },
                                { name: 'Type', value: data.type }
                            );
                        break;
                }
                break;
            }

            case 'role': {
                switch (data.action) {
                    case 'create':
                        embed
                            .setTitle('Role Created')
                            .setDescription(`Role ${data.role} was created.`);
                        break;
                    case 'update':
                        embed
                            .setTitle('Role Updated')
                            .setDescription(`Role ${data.role} was updated.`)
                            .addFields(
                                Object.entries(data.changes).map(([field, value]) => ({
                                    name: field,
                                    value: `${value.old} → ${value.new}`
                                }))
                            );
                        break;
                    case 'delete':
                        embed
                            .setTitle('Role Deleted')
                            .setDescription('A role was deleted.')
                            .addFields(
                                { name: 'Name', value: data.name },
                                { name: 'Color', value: data.color },
                                { name: 'Position', value: data.position.toString() }
                            );
                        break;
                }
                break;
            }
        }

        return embed;
    }

    getColor(action) {
        switch (action) {
            case 'create':
            case 'join':
                return this.config.colors.create;
            case 'update':
                return this.config.colors.update;
            case 'delete':
            case 'leave':
            case 'ban':
            case 'kick':
                return this.config.colors.delete;
            default:
                return this.config.colors.other;
        }
    }
}

module.exports = new AuditLogger(); 