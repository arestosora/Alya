import { SapphireClient, LogLevel, container } from "@sapphire/framework";
import { getRootData } from "@sapphire/pieces";
import { GatewayIntentBits, Partials } from "discord.js";
import { Kazagumo, Payload, Plugins } from "kazagumo";
import Spotify from 'kazagumo-spotify';
import { Connectors } from 'shoukaku';
import config from "../config";
import { join } from "path";
import { envParseString } from "@skyra/env-utilities";

export class Client extends SapphireClient {
    private rootData = getRootData();
    constructor() {
        super({
            defaultPrefix: config.Bot.prefix,
            regexPrefix: /^(hey +)?bot[,! ]/i,
            caseInsensitiveCommands: true,
            logger: {
                level: LogLevel.Info
            },
            shards: 'auto',
            intents: [
                GatewayIntentBits.DirectMessageReactions,
                GatewayIntentBits.DirectMessages,
                GatewayIntentBits.GuildModeration,
                GatewayIntentBits.GuildEmojisAndStickers,
                GatewayIntentBits.GuildMembers,
                GatewayIntentBits.GuildMessageReactions,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildVoiceStates,
                GatewayIntentBits.MessageContent
            ],
            partials: [Partials.Channel],
            presence: {
                activities: [
                    {
                        name: config.Bot.presence.name,
                        type: config.Bot.presence.type,
                    }
                ],
                status: config.Bot.presence.status
            },
            loadMessageCommandListeners: true
        });

        this.stores.get('listeners').registerPath(join(this.rootData.root, 'events'));
    }

    public override async login(token?: string): Promise<string> {
        container.kazagumo = new Kazagumo({
            defaultSearchEngine: config.Bot.searchEngine,
            send: (guildId: string, payload: Payload) => {
                const guild = this.guilds.cache.get(guildId)
                if (guild) guild.shard.send(payload)
            },
            plugins: [
                new Plugins.PlayerMoved(this),
                new Spotify({
                    clientId: envParseString('SPOTIFY_CLIENT_ID'),
                    clientSecret: envParseString('SPOTIFY_CLIENT_SECRET'),
                    playlistPageLimit: 1000
                })
            ]
        }, new Connectors.DiscordJS(this), config.Nodes);
        return super.login(token);
    }
}

export const client = new Client();

