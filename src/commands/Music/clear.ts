import { ApplyOptions } from '@sapphire/decorators';
import { Command } from '@sapphire/framework';
import config from '../../config';
import { AlyaCommand } from '../../lib/command';

@ApplyOptions<Command.Options>({
    description: 'Clears the current queue'
})
export class ClearCommand extends AlyaCommand {
    public override registerApplicationCommands(registry: Command.Registry) {
        registry.registerChatInputCommand((builder) =>
            builder
                .setName(this.name)
                .setDescription(this.description)
        );
    }

    public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
        await interaction.deferReply();

        if (!await this.MemberInVoiceChannel(interaction)) return;

        const player = await this.PlayerExists(interaction);
        if (!player) return;
        if (!await this.QueueNotEmpty(interaction, player)) return;

        player.queue.clear();
        await this.Reply(interaction, `The queue has been cleared. ${config.emojis.check}`);
    }
}
