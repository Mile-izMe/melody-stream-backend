import {
    Injectable,
} from "@nestjs/common"
import {
    IQueryHandler,
    QueryHandler,
} from "@nestjs/cqrs"
import {
    ElasticsearchService,
} from "@modules/elasticsearch/elasticsearch.service"
import {
    PrismaService,
} from "@modules/databases"
import {
    ICQRSHandler,
} from "@modules/cqrs"
import {
    GlobalSearchQuery,
} from "./global-search.query"
import {
    GlobalSearchResponseData,
} from "./types"
import {
    SongItem,
} from "../songs/types"
import {
    PlaylistItem,
} from "../playlists/types"
import {
    UserItem,
} from "../user/queries/shared/user-item"

@QueryHandler(GlobalSearchQuery)
@Injectable()
export class GlobalSearchHandler
    extends ICQRSHandler<GlobalSearchQuery, GlobalSearchResponseData>
    implements IQueryHandler<GlobalSearchQuery, GlobalSearchResponseData> {
    constructor(
        private readonly elasticsearchService: ElasticsearchService,
        private readonly prisma: PrismaService,
    ) {
        super()
    }

    protected override async process(
        query: GlobalSearchQuery,
    ): Promise<GlobalSearchResponseData> {
        const {
            request,
        } = query.params
        const {
            keyword,
            limit = 5,
        } = request

        // Return empty if keyword is empty
        if (!keyword || keyword.trim() === "") {
            return {
                songs: [],
                playlists: [],
                users: [],
            }
        }

        // Search songs, playlists, and users in parallel using keyword
        const [songsResult,
            playlistsResult,
            usersResult] = await Promise.all([
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            this.elasticsearchService.search<any>(
                "Song",
                {
                    keyword: keyword,
                    from: 0,
                    size: limit,
                },
            ),
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            this.elasticsearchService.search<any>(
                "Playlist",
                {
                    keyword: keyword,
                    from: 0,
                    size: limit,
                },
            ),
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            this.elasticsearchService.search<any>(
                "User",
                {
                    keyword: keyword,
                    from: 0,
                    size: limit,
                },
            ),
        ])

        // Convert Elasticsearch results to proper types
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const songs = (songsResult.data ?? []).map((item: any) => ({
            id: item.id ?? "",
            title: item.title ?? "",
            artist: item.artist ?? "",
            audioUrl: item.audioUrl ?? "",
            thumbnailUrl: item.thumbnailUrl ?? null,
            duration: item.duration ?? null,
            isEditable: item.isEditable ?? false,
            createdAt: item.createdAt ? new Date(item.createdAt) : new Date(),
            updatedAt: item.updatedAt ? new Date(item.updatedAt) : new Date(),
        })) as SongItem[]

         
        const playlists = (playlistsResult.data ?? [])
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .map((item: any) => ({
                id: item.id ?? "",
                name: item.name ?? "",
                songCount: item.songCount ?? 0,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                songs: (item.songs ?? []).map((song: any) => ({
                    id: song.id ?? "",
                    title: song.title ?? "",
                    artist: song.artist ?? "",
                    audioUrl: song.audioUrl ?? "",
                    thumbnailUrl: song.thumbnailUrl ?? null,
                    duration: song.duration ?? null,
                    isEditable: song.isEditable ?? false,
                    createdAt: song.createdAt ? new Date(song.createdAt) : new Date(),
                    updatedAt: song.updatedAt ? new Date(song.updatedAt) : new Date(),
                })),
                createdAt: item.createdAt ? new Date(item.createdAt) : new Date(),
                updatedAt: item.updatedAt ? new Date(item.updatedAt) : new Date(),
            })) as PlaylistItem[]

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const users = (usersResult.data ?? []).map((item: any) => ({
            id: item.id ?? "",
            username: item.username ?? "",
            email: item.email ?? "",
            password: item.password ?? "",
            isActive: item.isActive ?? true,
            status: item.status ?? "active",
            roles: item.roles ?? [],
            permissions: item.permissions ?? [],
            createdAt: item.createdAt ? new Date(item.createdAt) : new Date(),
            createBy: item.createBy ?? null,
            updatedAt: item.updatedAt ? new Date(item.updatedAt) : new Date(),
            updateBy: item.updateBy ?? null,
        })) as UserItem[]

        return {
            songs,
            playlists,
            users,
        }
    }
}

