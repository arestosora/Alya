import { ApplyOptions } from '@sapphire/decorators';
import { PaginatedMessage } from '@sapphire/discord.js-utilities';
import { Command } from '@sapphire/framework';
import { EmbedBuilder, ButtonStyle, ComponentType, Colors } from 'discord.js';
import { AlyaCommand } from '../../lib/command';

@ApplyOptions<Command.Options>({
    description: 'Show the current song queue'
})
export class QueueCommand extends AlyaCommand {
    public override registerApplicationCommands(registry: Command.Registry) {
        registry.registerChatInputCommand((builder) =>
            builder
                .setName(this.name)
                .setDescription(this.description)
        );
    }


    public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
        await interaction.deferReply();

        const player = await this.PlayerExists(interaction);
        if (!player) return;

        if (!await this.QueueNotEmpty(interaction, player)) return;

        const paginatedMessage = new PaginatedMessage({
            template: new EmbedBuilder()
                .setColor(Colors.White)
        });

        const tracks = player.queue;
        const itemsPerPage = 10;
        const totalPages = Math.ceil(tracks.length / itemsPerPage);

        for (let i = 0; i < totalPages; i++) {
            const start = i * itemsPerPage;
            const currentTracks = tracks.slice(start, start + itemsPerPage);

            paginatedMessage.addPageEmbed((embed) =>
                embed
                    .setTitle(`Queue - Page ${i + 1}/${totalPages}`)
                    .setDescription(
                        currentTracks
                            .map((track, index) => `${start + index + 1}. [**${track.title}** by **${track.author}**](${track.uri})`)
                            .join('\n')
                    )
            );
        }

        paginatedMessage.setActions([
            {
                customId: '@sapphire/paginated-messages.firstPage',
                style: ButtonStyle.Primary,
                emoji: '⏮️',
                type: ComponentType.Button,
                run: ({ handler }) => (handler.index = 0)
            },
            {
                customId: '@sapphire/paginated-messages.previousPage',
                style: ButtonStyle.Primary, 
                emoji: '◀️',
                type: ComponentType.Button,
                run: ({ handler }) => {
                    if (handler.index === 0) {
                        handler.index = handler.pages.length - 1;
                    } else {
                        --handler.index;
                    }
                }
            },
            {
                customId: '@sapphire/paginated-messages.nextPage',
                style: ButtonStyle.Primary,
                emoji: '▶️',
                type: ComponentType.Button,
                run: ({ handler }) => {
                    if (handler.index === handler.pages.length - 1) {
                        handler.index = 0;
                    } else {
                        ++handler.index;
                    }
                }
            },
            {
                customId: '@sapphire/paginated-messages.goToLastPage',
                style: ButtonStyle.Primary,
                emoji: '⏭️',
                type: ComponentType.Button,
                run: ({ handler }) => (handler.index = handler.pages.length - 1)
            },
            {
                customId: '@sapphire/paginated-messages.stop',
                style: ButtonStyle.Danger,
                emoji: '⏹️',
                type: ComponentType.Button,
                run: ({ collector }) => {
                    collector.stop();
                }
            }
        ]);

        return await paginatedMessage.run(interaction, interaction.user);
    }
}