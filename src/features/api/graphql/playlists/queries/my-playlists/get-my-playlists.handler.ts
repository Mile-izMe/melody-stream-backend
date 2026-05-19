import {
    ICQRSHandler,
} from "@modules/cqrs"
import {
    PrismaService,
} from "@modules/databases"
import {
    Prisma,
} from "@prisma/client"
import {
    Injectable,
} from "@nestjs/common"
import {
    IQueryHandler,
    QueryHandler,
} from "@nestjs/cqrs"
import {
    GetMyPlaylistsQuery,
} from "./get-my-playlists.query"
import {
    GetMyPlaylistsResponseData,
} from "./types"
import {
    toPlaylistItem,
} from "../../types"
import {
    decodeCursor,
    encodeCursor,
    normalizeLimit,
    normalizePageNumber,
} from "@features/api/graphql/shared"
import {
    buildPlaylistOrderBy,
    buildPlaylistWhere,
} from "./utils"

@QueryHandler(GetMyPlaylistsQuery)
@Injectable()
export class GetMyPlaylistsHandler
    extends ICQRSHandler<GetMyPlaylistsQuery, GetMyPlaylistsResponseData>
    implements IQueryHandler<GetMyPlaylistsQuery, GetMyPlaylistsResponseData> {
    constructor(
        private readonly prisma: PrismaService,
    ) {
        super()
    }

    protected override async process(
        query: GetMyPlaylistsQuery,
    ): Promise<GetMyPlaylistsResponseData> {
        const {
            request,
            userId,
        } = query.params

        const filters = request.filters
        const limit = normalizeLimit(filters.limit)
        const pageNumber = normalizePageNumber(filters.pageNumber)
        const cursorId = decodeCursor(filters.cursor)

        const where: Prisma.PlaylistWhereInput = {
            userId,
            ...buildPlaylistWhere(filters.search),
        }

        const orderBy = buildPlaylistOrderBy(filters.sorts)
        const skip = cursorId
            ? 1
            : (pageNumber - 1) * limit

        const [playlists,
            count] = await Promise.all([
            this.prisma.playlist.findMany({
                where,
                orderBy,
                take: limit + 1,
                skip,
                ...(cursorId && {
                    cursor: {
                        id: cursorId,
                    },
                }),
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
            }),
            this.prisma.playlist.count({
                where,
            }),
        ])

        const hasNextPage = playlists.length > limit
        const currentItems = hasNextPage
            ? playlists.slice(0,
                limit)
            : playlists

        const nextCursor = hasNextPage && currentItems.length
            ? encodeCursor(currentItems[currentItems.length - 1].id)
            : undefined

        return {
            count,
            data: currentItems.map((playlist) => toPlaylistItem(playlist)),
            cursor: nextCursor,
        }
    }
}
