export type CircleFacet = {
    id: number;
    key: string;
    value: string;
    label: string;
    description: string | null;
    filters?: Record<string, unknown> | null;
    isDefault: boolean;
    sortOrder: number;
};

export type CircleMembership = {
    role: string;
    preferences?: Record<string, unknown> | null;
    joinedAt?: string | null;
};

export type Circle = {
    id: number;
    slug: string;
    name: string;
    tagline: string | null;
    description: string | null;
    interest?: {
        id: number;
        name: string;
        slug: string;
    };
    isFeatured: boolean;
    visibility: string;
    sortOrder: number;
    facetFilters?: Record<string, unknown> | null;
    metadata?: Record<string, unknown> | null;
    membersCount: number;
    joined: boolean;
    membership?: CircleMembership | null;
    facets: CircleFacet[];
};

export type CirclePaginationMeta = {
    current_page: number;
    per_page: number;
    total: number;
    has_more_pages: boolean;
};

export type CircleCollection = {
    data: Circle[];
    meta: CirclePaginationMeta;
};

export type CircleFilterState = {
    search?: string | null;
    interest?: string | null;
    joined?: boolean;
    sort?: string | null;
};
