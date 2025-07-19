const { PermissionsBitField, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const regexManager = require('../../utils/regexManager');
const dataManager = require('../../utils/dataManager');
const serverManager = require('../../utils/serverManager');

module.exports = {
    name: 'swear-block',
    description: 'Manage swear word blocking system',
    permissions: [PermissionsBitField.Flags.ManageMessages],
    async execute(message, args) {
        if (!message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
            const embed = new EmbedBuilder()
                .setColor('#0d0d0d')
                .setDescription('You do not have permission to use this command.')
                .setFooter({ text: message.author.tag, iconURL: message.author.displayAvatarURL() });
            
            return message.reply({ embeds: [embed] });
        }

        const subCommand = args[0]?.toLowerCase();
        const pattern = args.slice(1).join(' ');

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('delete_message')
                    .setLabel('Delete Message')
                    .setStyle(ButtonStyle.Danger)
            );

        switch (subCommand) {
            case 'toggle': {
                const isEnabled = await serverManager.toggleSystem(message.guild.id, 'swearBlock');
                const status = isEnabled ? 'enabled' : 'disabled';
                
                const embed = new EmbedBuilder()
                    .setColor('#0d0d0d')
                    .setTitle('Swear Word Blocking System')
                    .setDescription(`System has been ${status}.`)
                    .setFooter({ text: message.author.tag, iconURL: message.author.displayAvatarURL() })
                    .setTimestamp();

                const response = await message.reply({ embeds: [embed], components: [row] });

                const collector = response.createMessageComponentCollector({ time: 30000 });
                collector.on('collect', async i => {
                    if (i.customId === 'delete_message') {
                        await Promise.all([
                            message.delete(),
                            response.delete()
                        ]).catch(console.error);
                    }
                });
                break;
            }

            case 'add':
                if (!pattern) {
                    const embed = new EmbedBuilder()
                        .setColor('#0d0d0d')
                        .setDescription('Please specify the swear word pattern to add.')
                        .setFooter({ text: message.author.tag, iconURL: message.author.displayAvatarURL() });
                    
                    return message.reply({ embeds: [embed] });
                }

                const isEnabled = await serverManager.isSystemEnabled(message.guild.id, 'swearBlock');
                if (!isEnabled) {
                    const embed = new EmbedBuilder()
                        .setColor('#0d0d0d')
                        .setDescription('Swear word blocking system is currently disabled. Enable it first with `swear-block toggle`')
                        .setFooter({ text: message.author.tag, iconURL: message.author.displayAvatarURL() });
                    
                    return message.reply({ embeds: [embed] });
                }

                await serverManager.addCustomPattern(message.guild.id, 'swearBlock', pattern);
                
                const addEmbed = new EmbedBuilder()
                    .setColor('#0d0d0d')
                    .setTitle('Pattern Added')
                    .setDescription(`Successfully added pattern: \`${pattern}\``)
                    .setFooter({ text: message.author.tag, iconURL: message.author.displayAvatarURL() })
                    .setTimestamp();

                const response = await message.reply({ embeds: [addEmbed], components: [row] });

                const collector = response.createMessageComponentCollector({ time: 30000 });
                collector.on('collect', async i => {
                    if (i.customId === 'delete_message') {
                        await Promise.all([
                            message.delete(),
                            response.delete()
                        ]).catch(console.error);
                    }
                });
                break;

            case 'remove':
                if (!pattern) {
                    const embed = new EmbedBuilder()
                        .setColor('#0d0d0d')
                        .setDescription('Please specify the pattern to remove.')
                        .setFooter({ text: message.author.tag, iconURL: message.author.displayAvatarURL() });
                    
                    return message.reply({ embeds: [embed] });
                }

                const removed = await serverManager.removeCustomPattern(message.guild.id, 'swearBlock', pattern);
                if (!removed) {
                    const embed = new EmbedBuilder()
                        .setColor('#0d0d0d')
                        .setDescription('Pattern not found in the custom patterns list.')
                        .setFooter({ text: message.author.tag, iconURL: message.author.displayAvatarURL() });
                    
                    return message.reply({ embeds: [embed] });
                }

                const removeEmbed = new EmbedBuilder()
                    .setColor('#0d0d0d')
                    .setTitle('Pattern Removed')
                    .setDescription(`Successfully removed pattern: \`${pattern}\``)
                    .setFooter({ text: message.author.tag, iconURL: message.author.displayAvatarURL() })
                    .setTimestamp();

                const removeResponse = await message.reply({ embeds: [removeEmbed], components: [row] });

                const removeCollector = removeResponse.createMessageComponentCollector({ time: 30000 });
                removeCollector.on('collect', async i => {
                    if (i.customId === 'delete_message') {
                        await Promise.all([
                            message.delete(),
                            removeResponse.delete()
                        ]).catch(console.error);
                    }
                });
                break;

            case 'list': {
                const customPatterns = await serverManager.getCustomPatterns(message.guild.id, 'swearBlock');
                const defaultPatterns = await dataManager.getPatterns('swears');
                const isEnabled = await serverManager.isSystemEnabled(message.guild.id, 'swearBlock');

                const embed = new EmbedBuilder()
                    .setColor('#0d0d0d')
                    .setTitle('Swear Word Blocking Patterns')
                    .setDescription(`**System Status:** ${isEnabled ? 'Enabled' : 'Disabled'}`)
                    .setFooter({ text: message.author.tag, iconURL: message.author.displayAvatarURL() })
                    .setTimestamp();

                if (customPatterns.length > 0) {
                    embed.addFields({
                        name: 'Custom Patterns',
                        value: customPatterns.map((p, i) => `${i + 1}. \`${p}\``).join('\n')
                    });
                }

                embed.addFields({
                    name: 'Default Patterns',
                    value: defaultPatterns.map((p, i) => `${i + 1}. \`${p}\``).join('\n')
                });

                const listResponse = await message.reply({ embeds: [embed], components: [row] });

                const listCollector = listResponse.createMessageComponentCollector({ time: 30000 });
                listCollector.on('collect', async i => {
                    if (i.customId === 'delete_message') {
                        await Promise.all([
                            message.delete(),
                            listResponse.delete()
                        ]).catch(console.error);
                    }
                });
                break;
            }

            default: {
                const embed = new EmbedBuilder()
                    .setColor('#0d0d0d')
                    .setTitle('Swear Word Blocking Commands')
                    .setDescription('Here are the available commands:')
                    .addFields(
                        { name: 'swear-block toggle', value: '-# Enable/disable the system' },
                        { name: 'swear-block add <pattern>', value: '-# Add a new pattern' },
                        { name: 'swear-block remove <pattern>', value: '-# Remove a pattern' },
                        { name: 'swear-block list', value: '-# List all patterns' }
                    )
                    .setFooter({ text: message.author.tag, iconURL: message.author.displayAvatarURL() });

                message.reply({ embeds: [embed] });
            }
        }
    }
};
