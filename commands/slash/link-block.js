const { SlashCommandBuilder, PermissionsBitField, EmbedBuilder } = require('discord.js');
const regexManager = require('../../utils/regexManager');
const dataManager = require('../../utils/dataManager');
const serverManager = require('../../utils/serverManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('link-block')
        .setDescription('Manage link blocking system')
        .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageMessages)
        .addSubcommand(subcommand =>
            subcommand
                .setName('toggle')
                .setDescription('Enable or disable the link blocking system')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('add')
                .setDescription('Add a new link pattern')
                .addStringOption(option =>
                    option
                        .setName('pattern')
                        .setDescription('Pattern to add')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription('Remove a link pattern')
                .addStringOption(option =>
                    option
                        .setName('pattern')
                        .setDescription('Pattern to remove')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('List all link patterns')
        ),

    async execute(interaction) {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
            const embed = new EmbedBuilder()
                .setColor('#0d0d0d')
                .setDescription('You do not have permission to use this command!')
                .setFooter({ text: interaction.user.tag, iconURL: interaction.user.displayAvatarURL() });

            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        const subCommand = interaction.options.getSubcommand();

        switch (subCommand) {
            case 'toggle': {
                const isEnabled = await serverManager.toggleSystem(interaction.guild.id, 'linkBlock');
                const status = isEnabled ? 'enabled' : 'disabled';
                
                const embed = new EmbedBuilder()
                    .setColor('#0d0d0d')
                    .setTitle('Link Blocking System')
                    .setDescription(`System has been ${status}.`)
                    .setFooter({ text: interaction.user.tag, iconURL: interaction.user.displayAvatarURL() })
                    .setTimestamp();

                await interaction.reply({ embeds: [embed], ephemeral: true });
                break;
            }

            case 'add': {
                const pattern = interaction.options.getString('pattern');
                
                const isEnabled = await serverManager.isSystemEnabled(interaction.guild.id, 'linkBlock');
                if (!isEnabled) {
                    const embed = new EmbedBuilder()
                        .setColor('#0d0d0d')
                        .setDescription('Link blocking system is currently disabled. Enable it first with `/link-block toggle`')
                        .setFooter({ text: interaction.user.tag, iconURL: interaction.user.displayAvatarURL() });

                    return interaction.reply({ embeds: [embed], ephemeral: true });
                }

                await serverManager.addCustomPattern(interaction.guild.id, 'linkBlock', pattern);
                
                const embed = new EmbedBuilder()
                    .setColor('#0d0d0d')
                    .setTitle('Pattern Added')
                    .setDescription(`Successfully added pattern: \`${pattern}\``)
                    .setFooter({ text: interaction.user.tag, iconURL: interaction.user.displayAvatarURL() })
                    .setTimestamp();

                await interaction.reply({ embeds: [embed], ephemeral: true });
                break;
            }

            case 'remove': {
                const pattern = interaction.options.getString('pattern');
                
                const removed = await serverManager.removeCustomPattern(interaction.guild.id, 'linkBlock', pattern);
                if (!removed) {
                    const embed = new EmbedBuilder()
                        .setColor('#0d0d0d')
                        .setDescription('Pattern not found in the custom patterns list!')
                        .setFooter({ text: interaction.user.tag, iconURL: interaction.user.displayAvatarURL() });

                    return interaction.reply({ embeds: [embed], ephemeral: true });
                }

                const embed = new EmbedBuilder()
                    .setColor('#0d0d0d')
                    .setTitle('Pattern Removed')
                    .setDescription(`Successfully removed pattern: \`${pattern}\``)
                    .setFooter({ text: interaction.user.tag, iconURL: interaction.user.displayAvatarURL() })
                    .setTimestamp();

                await interaction.reply({ embeds: [embed], ephemeral: true });
                break;
            }

            case 'list': {
                const customPatterns = await serverManager.getCustomPatterns(interaction.guild.id, 'linkBlock');
                const defaultPatterns = await dataManager.getPatterns('links');
                const isEnabled = await serverManager.isSystemEnabled(interaction.guild.id, 'linkBlock');

                const embed = new EmbedBuilder()
                    .setColor('#0d0d0d')
                    .setTitle('Link Blocking Patterns')
                    .setDescription(`**System Status:** ${isEnabled ? 'Enabled' : 'Disabled'}`)
                    .setFooter({ text: interaction.user.tag, iconURL: interaction.user.displayAvatarURL() })
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

                await interaction.reply({ embeds: [embed], ephemeral: true });
                break;
            }
        }
    }
};
