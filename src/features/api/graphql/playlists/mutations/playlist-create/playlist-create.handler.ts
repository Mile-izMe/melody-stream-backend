import {
    ICQRSHandler,
} from "@modules/cqrs"
import {
    PrismaService,
} from "@modules/databases"
import {
    Injectable,
} from "@nestjs/common"
import {
    CommandHandler,
    ICommandHandler,
} from "@nestjs/cqrs"
import {
    PlaylistCreateCommand,
} from "./playlist-create.command"
import {
    PlaylistCreateResponseData,
} from "./types"
import {
    toPlaylistItem,
} from "../../types"

@CommandHandler(PlaylistCreateCommand)
@Injectable()
export class PlaylistCreateHandler
    extends ICQRSHandler<PlaylistCreateCommand, PlaylistCreateResponseData>
    implements ICommandHandler<PlaylistCreateCommand, PlaylistCreateResponseData> {
    constructor(
        private readonly prisma: PrismaService,
    ) {
        super()
    }

    protected override async process(
        command: PlaylistCreateCommand,
    ): Promise<PlaylistCreateResponseData> {
        const {
            request,
            userId,
        } = command.params

        const playlist = await this.prisma.playlist.create({
            data: {
                name: request.name,
                userId,
                createdBy: userId,
                updatedBy: userId,
            },
            include: {
                _count: {
                    select: {
                        songs: true,
                    },
                },
                songs: {
                    include: {
                        song: true,
                    },
                },
            },
        })

        return {
            playlist: toPlaylistItem(playlist),
        }
    }
}
