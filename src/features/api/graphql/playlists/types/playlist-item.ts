import {
    Field,
    Int,
    ObjectType,
} from "@nestjs/graphql"
import {
    SongItem,
} from "../../songs/types"

@ObjectType()
export class PlaylistItem {
    @Field(() => String)
        id: string

    @Field(() => String)
        name: string

    @Field(() => Int)
        songCount: number

    @Field(() => [SongItem])
        songs: SongItem[]

    @Field(() => Date)
        createdAt: Date

    @Field(() => Date)
        updatedAt: Date
}

export interface PlaylistItemSource {
    id: string
    name: string
    createdAt: Date
    updatedAt: Date
    _count?: {
        songs: number
    }
    songs?: Array<{
        song: {
            id: string
            title: string
            artist: string
            audioUrl: string
            thumbnailUrl?: string | null
            duration?: number | null
            createdAt: Date
            updatedAt: Date
        }
    }>
}

export function toPlaylistItem(source: PlaylistItemSource): PlaylistItem {
    return {
        id: source.id,
        name: source.name,
        songCount: source._count?.songs ?? 0,
        songs: (source.songs ?? []).map((item) => ({
            id: item.song.id,
            title: item.song.title,
            artist: item.song.artist,
            audioUrl: item.song.audioUrl,
            thumbnailUrl: item.song.thumbnailUrl,
            duration: item.song.duration,
            isEditable: false,
            createdAt: item.song.createdAt,
            updatedAt: item.song.updatedAt,
        })),
        createdAt: source.createdAt,
        updatedAt: source.updatedAt,
    }
}
