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
    IQueryHandler,
    QueryHandler,
} from "@nestjs/cqrs"
import {
    GetPermissionsByRoleQuery,
} from "./get-permissions-by-role.query"
import {
    GetPermissionsByRoleResponseData,
} from "./types"
import {
    toRoleItem,
    toPermissionItem,
} from "../../types"

@QueryHandler(GetPermissionsByRoleQuery)
@Injectable()
export class GetPermissionsByRoleHandler
    extends ICQRSHandler<GetPermissionsByRoleQuery, GetPermissionsByRoleResponseData>
    implements IQueryHandler<GetPermissionsByRoleQuery, GetPermissionsByRoleResponseData> {
    constructor(
        private readonly prisma: PrismaService,
    ) {
        super()
    }

    protected override async process(
    ): Promise<GetPermissionsByRoleResponseData> {
        const roles = await this.prisma.role.findMany({
            orderBy: {
                name: "asc",
            },
            include: {
                users: {
                    include: {
                        user: {
                            select: {
                                username: true,
                                email: true,
                            },
                        },
                    },
                },
                permissions: {
                    include: {
                        permission: true,
                    },
                    orderBy: {
                        permission: {
                            name: "asc",
                        },
                    },
                },
            },
        })

        return {
            roles: roles.map((role) => {
                const permissions = role.permissions.map((item) => toPermissionItem(item.permission))
                const users = role.users
                    .map((item) => ({
                        username: item.user.username,
                        email: item.user.email,
                    }))
                    .sort((a,
                        b) => a.username.localeCompare(b.username))

                return {
                    role: toRoleItem(role),
                    permissions,
                    users,
                    permissionCount: permissions.length,
                    userCount: role.users.length,
                }
            }),
        }
    }
}
