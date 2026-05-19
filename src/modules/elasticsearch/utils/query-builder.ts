import {
    estypes 
} from "@elastic/elasticsearch"

export interface BuildSearchQueryParams {
    filters?: estypes.QueryDslQueryContainer[];
    search?: string;
    searchFields?: string[];
}

export class ElasticsearchQueryBuilder {
    /**
     * Builds a standard Elasticsearch boolean query with optional fuzzy searching.
     * @param params Parameters including base filters and search terms.
     */
    static buildSearchQuery({
        filters = [], search, searchFields = [] 
    }: BuildSearchQueryParams): estypes.QueryDslQueryContainer {
        const query: estypes.QueryDslQueryContainer = {
            bool: {
                must: [...filters],
            },
        }

        if (search && searchFields.length > 0) {
            query.bool!.must = Array.isArray(query.bool!.must) ? query.bool!.must : [query.bool!.must as estypes.QueryDslQueryContainer]

            // Build a combined query: include both a fuzzy multi_match and a
            // bool_prefix multi_match so that short prefix searches (e.g.
            // "HIEU" -> "HIEUTHUHAI") and longer fuzzy searches both work.
            const fuzzyMatch: any = {
                multi_match: {
                    query: search,
                    fields: searchFields,
                    fuzziness: "AUTO",
                    operator: "and",
                },
            }

            const prefixMatch: any = {
                multi_match: {
                    query: search,
                    fields: searchFields,
                    type: "bool_prefix",
                    operator: "and",
                },
            }

            query.bool!.must.push({
                bool: {
                    should: [fuzzyMatch, prefixMatch],
                    minimum_should_match: 1,
                },
            })
        }

        return query
    }
}
