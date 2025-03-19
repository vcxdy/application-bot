const { Client, GatewayIntentBits, SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
require('dotenv').config();

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMembers, GatewayIntentBits.DirectMessages] });

const APPLICATIONS_CHANNEL_ID = '1301728298841280624'; // Replace with your actual channel ID
const REVIEWER_ROLE_ID = '1301713340523089930'; // Updated to allow this role to review applications
const ACCEPTED_ROLES = ['1301728579465515100', '1301713340523089930'];

client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}`);
});

client.on('interactionCreate', async (interaction) => {
    if (interaction.isCommand() && interaction.commandName === 'apply') {
        await interaction.reply({ content: 'Processing your application...', ephemeral: true });
        
        const embeds = [
            new EmbedBuilder().setTitle('Applying for the RAC').setDescription('The RAC offers three forms of applications to join our immersive company:').setColor('#FFA500'),
            new EmbedBuilder().setTitle('Standard Admission').setDescription('Our most common form of applications, typically new citizens trying to find a good job for money.').setColor('#FFA500'),
            new EmbedBuilder().setTitle('Direct Entry').setDescription('Our second most common form of applying. You can apply using Direct Entry by being employed from any of our partners found in the https://discordapp.com/channels/1301237127434211448/1352008319338025092 channel.').setColor('#FFA500'),
            new EmbedBuilder().setTitle('Flatbed Fast-track').setDescription('Our least common form of applying. You can apply using Flatbed Fast-track by being employed in the Automobile Association or Jackboys.').setColor('#FFA500'),
            new EmbedBuilder().setTitle('Disclaimer ⚠️').setDescription('By being an employee for the RAC, you automatically accept our Universal [Employment Contract.](https://docs.google.com/document/d/1dwku6vymP3EBNGWG3E_CRZD_XBzO0g9vN9gI_iJ4a9w/edit?usp=sharing)').setColor('#FFA500')
        ];

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('apply_menu')
            .setPlaceholder('Choose one of the following options...')
            .addOptions([
                { label: 'Standard Application', value: 'standard' },
                { label: 'Direct Entry', value: 'direct' },
            ]);

        const row = new ActionRowBuilder().addComponents(selectMenu);

        await interaction.followUp({ content: 'Applying for the RAC', embeds, components: [row], ephemeral: true });
    } 
    else if (interaction.isStringSelectMenu() && interaction.customId === 'apply_menu') {
        const selected = interaction.values[0];

        if (selected === 'standard') {
            const modal = new ModalBuilder().setCustomId('standard_application').setTitle('RAC Standard Application Form');
            const licenseInput = new TextInputBuilder()
                .setCustomId('license_plate')
                .setLabel('Enter your Westbridge License Plate')
                .setStyle(TextInputStyle.Short)
                .setRequired(true);
            modal.addComponents(new ActionRowBuilder().addComponents(licenseInput));
            await interaction.showModal(modal);
        } 
        else if (selected === 'direct') {
            const modal = new ModalBuilder().setCustomId('direct_entry').setTitle('RAC Direct Entry Application');
            const licenseInput = new TextInputBuilder()
                .setCustomId('license_plate')
                .setLabel('Enter your Westbridge License Plate')
                .setStyle(TextInputStyle.Short)
                .setValue('BQ76 HKY')
                .setRequired(true);
            modal.addComponents(new ActionRowBuilder().addComponents(licenseInput));
            await interaction.showModal(modal);
        }
    } 
    else if (interaction.isModalSubmit() && (interaction.customId === 'standard_application' || interaction.customId === 'direct_entry')) {
        const applicationsChannel = await client.channels.fetch(APPLICATIONS_CHANNEL_ID);
        const licensePlate = interaction.fields.getTextInputValue('license_plate');

        const applicationEmbed = new EmbedBuilder()
            .setTitle('New RAC Application')
            .setDescription(`**Applicant:** ${interaction.user}
            **License Plate:** ${licensePlate}`)
            .setColor('#FFA500');

        const acceptButton = new ButtonBuilder().setCustomId('accept_application').setLabel('Accept').setStyle(ButtonStyle.Success);
        const denyButton = new ButtonBuilder().setCustomId('deny_application').setLabel('Deny').setStyle(ButtonStyle.Danger);
        const buttonRow = new ActionRowBuilder().addComponents(acceptButton, denyButton);

        await applicationsChannel.send({ content: `${interaction.user}`, embeds: [applicationEmbed], components: [buttonRow] });
        await interaction.reply({ content: 'Your application has been submitted for review.', ephemeral: true });
    } 
    else if (interaction.isButton()) {
        if (!interaction.member.roles.cache.has(REVIEWER_ROLE_ID)) {
            return interaction.reply({ content: 'You do not have permission to review applications.', ephemeral: true });
        }

        const applicant = interaction.message.mentions.users.first();
        const member = await interaction.guild.members.fetch(applicant.id);
        
        if (interaction.customId === 'accept_application' && applicant) {
            await interaction.message.edit({ content: 'Application accepted and applicant has been notified.', components: [] });
            await applicant.send(`**RAC | APPLICATION RESULTS**\n\nCongratulations, ${applicant}!\n\nAfter careful consideration, your application for the RAC has been accepted. Before you go on duty, please send a request to the group and read the handbook.\n\nBy joining the RAC, you accept our Universal Employment Contract.\n\n**Links:**\n🔗 Group\n🔗 [Handbook](https://docs.google.com/spreadsheets/d/1BHzbQHy1MHyWGnVn8dkZB2Df6hffK_Z4OfvzOU0x3kw/edit?usp=sharing)\n\nRegards, RAC Application Team`);
            await member.roles.add(ACCEPTED_ROLES);
        }

        if (interaction.customId === 'deny_application' && applicant) {
            await interaction.message.edit({ content: 'Application denied and applicant has been notified.', components: [] });
            await applicant.send(`**RAC | APPLICATION RESULTS**\n\nHello ${applicant},\n\nAfter reviewing your application, the application team is sorry to say that you have failed. Please do not be discouraged as you may apply again.\n\nOnce again, you may reapply to join the RAC by redoing the same command.\n\nRegards,\nRAC Management Team`);
        }
    }
});

client.login(process.env.TOKEN);
