import {
    ICQRSHandler,
} from "@modules/cqrs"
import {
    PrismaService,
} from "@modules/databases"
import {
    ForbiddenException,
    Injectable,
    NotFoundException,
} from "@nestjs/common"
import {
    CommandHandler,
    ICommandHandler,
} from "@nestjs/cqrs"
import {
    PlaylistAddSongCommand,
} from "./playlist-add-song.command"
import {
    PlaylistAddSongResponseData,
} from "./types"
import {
    toPlaylistItem,
} from "../../types"

@CommandHandler(PlaylistAddSongCommand)
@Injectable()
export class PlaylistAddSongHandler
    extends ICQRSHandler<PlaylistAddSongCommand, PlaylistAddSongResponseData>
    implements ICommandHandler<PlaylistAddSongCommand, PlaylistAddSongResponseData> {
    constructor(
        private readonly prisma: PrismaService,
    ) {
        super()
    }

    protected override async process(
        command: PlaylistAddSongCommand,
    ): Promise<PlaylistAddSongResponseData> {
        const {
            request,
            userId,
        } = command.params

        const playlist = await this.prisma.playlist.findFirst({
            where: {
                id: request.playlistId,
            },
            select: {
                id: true,
                userId: true,
            },
        })

        if (!playlist) {
            throw new NotFoundException("Playlist not found")
        }

        if (playlist.userId !== userId) {
            throw new ForbiddenException("You do not own this playlist")
        }

        const song = await this.prisma.song.findFirst({
            where: {
                id: request.songId,
            },
            select: {
                id: true,
            },
        })

        if (!song) {
            throw new NotFoundException("Song not found")
        }

        const relation = await this.prisma.playlistSong.findFirst({
            where: {
                playlistId: request.playlistId,
                songId: request.songId,
            },
        })

        if (!relation) {
            await this.prisma.playlistSong.create({
                data: {
                    playlistId: request.playlistId,
                    songId: request.songId,
                },
            })
        }

        const updatedPlaylist = await this.prisma.playlist.findFirst({
            where: {
                id: request.playlistId,
                deletedAt: null,
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

        if (!updatedPlaylist) {
            throw new NotFoundException("Playlist not found")
        }

        return {
            playlist: toPlaylistItem(updatedPlaylist),
        }
    }
}
