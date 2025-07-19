const regexManager = require('../../utils/regexManager');
const dataManager = require('../../utils/dataManager');
const serverManager = require('../../utils/serverManager');
const warningManager = require('../../utils/warningManager');
const config = require('../../config.json');
const { PermissionsBitField } = require('discord.js');

module.exports = {
    name: 'messageCreate',
    async execute(message) {
        if (message.author.bot) return;

        const prefix = config.prefix;
        const isCommand = message.content.startsWith(prefix);

        if (isCommand) {
            const args = message.content.slice(prefix.length).trim().split(/ +/);
            const commandName = args.shift().toLowerCase();

            const command = message.client.commands.get(commandName);
            if (!command) return;

            try {
                await command.execute(message, args);
            } catch (error) {
                console.error('Error executing command:', error);
                message.reply('An error occurred while executing the command!').catch(() => {});
            }
            return;
        }

        const messageContent = message.content.toLowerCase();

        async function handleViolation(type, warningMessage) {
            try {
                await message.delete();
                
                const { count, shouldTimeout } = await warningManager.addWarning(
                    message.guild.id,
                    message.author.id,
                    `${type} violation`
                );

                let response = `${message.author}, ${warningMessage} (Warning ${count}/${config.moderationSettings.warningLimits.maxWarnings})`;

                if (shouldTimeout) {
                    try {
                        await message.member.timeout(
                            config.moderationSettings.warningLimits.timeoutDuration,
                            'Exceeded warning limit'
                        );
                        response += '\nYou have been timed out for exceeding the warning limit.';
                        await warningManager.clearWarnings(message.guild.id, message.author.id);
                    } catch (error) {
                        console.error('Error applying timeout:', error);
                    }
                }

                const warningMsg = await message.channel.send(response);
                setTimeout(() => warningMsg.delete().catch(() => {}), config.moderationSettings.deleteWarningTimeout);
            } catch (error) {
                console.error(`Error handling ${type} violation:`, error);
            }
        }

        const isLinkBlockEnabled = await serverManager.isSystemEnabled(message.guild.id, 'linkBlock');
        if (isLinkBlockEnabled) {
            const defaultPatterns = await dataManager.getPatterns('links');
            const customPatterns = await serverManager.getCustomPatterns(message.guild.id, 'linkBlock');
            
            const hasMatch = [...defaultPatterns, ...customPatterns].some(pattern => {
                const isMatch = messageContent.includes(pattern.toLowerCase());
                if (isMatch) console.log(`Matched link pattern: ${pattern}`);
                return isMatch;
            });

            if (hasMatch) {
                await handleViolation('link', config.moderationSettings.punishments.links.warningMessage);
                return;
            }
        }

        const isSwearBlockEnabled = await serverManager.isSystemEnabled(message.guild.id, 'swearBlock');
        if (isSwearBlockEnabled) {
            const defaultPatterns = await dataManager.getPatterns('swears');
            const customPatterns = await serverManager.getCustomPatterns(message.guild.id, 'swearBlock');
            
            const hasMatch = [...defaultPatterns, ...customPatterns].some(pattern => {
                const isMatch = messageContent.includes(pattern.toLowerCase());
                if (isMatch) console.log(`Matched swear pattern: ${pattern}`);
                return isMatch;
            });

            if (hasMatch) {
                await handleViolation('swear', config.moderationSettings.punishments.swears.warningMessage);
                return;
            }
        }

        const isAdsBlockEnabled = await serverManager.isSystemEnabled(message.guild.id, 'adsBlock');
        if (isAdsBlockEnabled) {
            const defaultPatterns = await dataManager.getPatterns('urls');
            const customPatterns = await serverManager.getCustomPatterns(message.guild.id, 'adsBlock');
            
            const hasMatch = [...defaultPatterns, ...customPatterns].some(pattern => {
                const isMatch = messageContent.includes(pattern.toLowerCase());
                if (isMatch) console.log(`Matched ad pattern: ${pattern}`);
                return isMatch;
            });

            if (hasMatch) {
                await handleViolation('advertisement', config.moderationSettings.punishments.ads.warningMessage);
                return;
            }
        }
    }
}; 