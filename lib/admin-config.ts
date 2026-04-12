export type AdminApiParams = Record<
  string,
  string | number | boolean | null | undefined
>;

export type AdminPagination = {
  page: number;
  totalPages?: number;
  total?: number;
  limit?: number;
};

export type BlogAdminItem = {
  _id: string;
  title: string;
  content: unknown;
  contentHtml?: string;
  abstract?: string;
  status: "pending" | "approved" | "rejected";
  adminComment?: string;
  author?: { _id?: string; name?: string; email?: string } | string;
  isAnonymous?: boolean;
  createdAt: string;
  updatedAt?: string;
  reviewedAt?: string;
  media?: Record<string, unknown>;
};

export type EventAdminItem = {
  _id: string;
  status?: "pending" | "approved" | "rejected";
  title?: string;
  organizationName?: string;
};

export type VacancyAdminItem = {
  _id: string;
  status?: "pending" | "approved" | "rejected";
  title?: string;
  organizationName?: string;
};

export type AdminAction<TItem> = {
  key: string;
  label: string;
  apiAction?: string;
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  type: "api" | "modal" | "navigation";
  scope?: "row" | "bulk";
  roles?: string[];
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  endpoint?: string;
  modalType?: string;
  confirmMessage?: string;
  getHref?: (item: TItem) => string;
  getBody?: (
    item: TItem,
    context?: Record<string, unknown>,
  ) => Record<string, unknown>;
  getParams?: (
    item: TItem,
    context?: Record<string, unknown>,
  ) => AdminApiParams | undefined;
};

export type AdminResourceConfig<TItem> = {
  listEndpoint: string;
  listParams?: AdminApiParams;
  actions: Record<string, AdminAction<TItem>>;
  mapResponse: (data: unknown) => {
    items: TItem[];
    pagination?: AdminPagination;
  };
};

export type AdminConfigMap = {
  blogs: AdminResourceConfig<BlogAdminItem>;
  events: AdminResourceConfig<EventAdminItem>;
  vacancies: AdminResourceConfig<VacancyAdminItem>;
};

export type AdminResourceKey = keyof AdminConfigMap;
export type AdminItemMap = {
  blogs: BlogAdminItem;
  events: EventAdminItem;
  vacancies: VacancyAdminItem;
};
export type AdminItemFor<K extends AdminResourceKey> = AdminItemMap[K];
export type AdminActionFor<K extends AdminResourceKey> =
  AdminConfigMap[K]["actions"][keyof AdminConfigMap[K]["actions"]];

export const adminConfig: AdminConfigMap = {
  blogs: {
    listEndpoint: "/api/admin/blogs",
    mapResponse: (data) => {
      const payload = data as {
        data?: {
          items?: Array<{
            id?: string;
            title?: string;
            content?: unknown;
            content_html?: string;
            abstract?: string;
            status?: "pending" | "approved" | "rejected";
            admin_comment?: string;
            author_id?: { id?: string; name?: string; email?: string } | string;
            is_anonymous?: boolean;
            created_at?: string;
            updated_at?: string;
            reviewed_at?: string;
            media?: Record<string, unknown>;
          }>;
          page?: number;
          total?: number;
          limit?: number;
        };
      };
      const rawItems = payload.data?.items || [];
      const items: BlogAdminItem[] = rawItems.map((item) => ({
        _id: item.id || "",
        title: item.title || "",
        content: item.content,
        contentHtml: item.content_html,
        abstract: item.abstract,
        status: item.status || "pending",
        adminComment: item.admin_comment,
        author:
          typeof item.author_id === "object"
            ? {
                _id: item.author_id?.id,
                name: item.author_id?.name,
                email: item.author_id?.email,
              }
            : item.author_id,
        isAnonymous: !!item.is_anonymous,
        createdAt: item.created_at || new Date().toISOString(),
        updatedAt: item.updated_at,
        reviewedAt: item.reviewed_at,
        media: item.media,
      }));
      return {
        items,
        pagination: {
          page: payload.data?.page || 1,
          totalPages: 1,
          total: payload.data?.total || items.length,
          limit: payload.data?.limit || 10,
        },
      };
    },
    actions: {
      preview: {
        key: "preview",
        label: "Önizləmə",
        variant: "primary",
        type: "navigation",
        scope: "row",
        roles: ["admin"],
        getHref: (item) => `/admin/preview/blog/${item._id}`,
      },
      review: {
        key: "review",
        label: "Yoxla",
        variant: "secondary",
        type: "modal",
        scope: "row",
        roles: ["admin"],
        modalType: "reviewBlog",
      },
      approve: {
        key: "approve",
        label: "Təsdiq Et",
        apiAction: "approve",
        method: "PUT",
        endpoint: "/api/admin/blogs/:id",
        variant: "primary",
        type: "api",
        scope: "row",
        roles: ["admin"],
        getBody: (_item, context) => ({
          status: "approved",
          adminComment: (context?.adminComment as string | null | undefined) || null,
        }),
      },
      reject: {
        key: "reject",
        label: "Rədd Et",
        apiAction: "reject",
        method: "PUT",
        endpoint: "/api/admin/blogs/:id",
        variant: "danger",
        type: "api",
        scope: "row",
        roles: ["admin"],
        getBody: (_item, context) => ({
          status: "rejected",
          adminComment: (context?.adminComment as string | undefined) || "",
        }),
      },
      delete: {
        key: "delete",
        label: "Sil",
        apiAction: "delete",
        method: "DELETE",
        endpoint: "/api/admin/blogs/:id",
        variant: "danger",
        type: "api",
        scope: "row",
        roles: ["admin"],
        confirmMessage: "Bu bloqu silmək istədiyinizə əminsiniz?",
      },
      bulkApprove: {
        key: "bulkApprove",
        label: "Hamısını Təsdiqlə",
        apiAction: "bulk_approve",
        method: "PATCH",
        variant: "primary",
        type: "api",
        scope: "bulk",
        roles: ["admin"],
        getBody: (_item, context) => ({
          storyIds: (context?.selectedItems as string[] | undefined) || [],
        }),
      },
      bulkReject: {
        key: "bulkReject",
        label: "Hamısını Rədd Et",
        apiAction: "bulk_reject",
        method: "PATCH",
        variant: "danger",
        type: "api",
        scope: "bulk",
        roles: ["admin"],
        getBody: (_item, context) => ({
          storyIds: (context?.selectedItems as string[] | undefined) || [],
          ...((context?.adminComment as string | undefined)
            ? { adminComment: context?.adminComment as string }
            : {}),
        }),
      },
      bulkDelete: {
        key: "bulkDelete",
        label: "Hamısını Sil",
        apiAction: "bulk_delete",
        method: "PATCH",
        variant: "danger",
        type: "api",
        scope: "bulk",
        roles: ["admin"],
        getBody: (_item, context) => ({
          storyIds: (context?.selectedItems as string[] | undefined) || [],
        }),
      },
    },
  },
  events: {
    listEndpoint: "/api/admin/events",
    mapResponse: (data) => {
      const payload = data as {
        events?: EventAdminItem[];
        pagination?: { page?: number; pages?: number };
        stats?: { total?: number };
      };
      return {
        items: payload.events || [],
        pagination: {
          page: payload.pagination?.page || 1,
          totalPages: payload.pagination?.pages || 1,
          total: payload.stats?.total || 0,
        },
      };
    },
    actions: {
      approve: {
        key: "approve",
        label: "Təsdiq Et",
        apiAction: "approve",
        method: "PATCH",
        endpoint: "/api/admin/events/:id",
        variant: "primary",
        type: "api",
        scope: "row",
        roles: ["admin"],
      },
      reject: {
        key: "reject",
        label: "Rədd Et",
        apiAction: "reject",
        method: "PATCH",
        endpoint: "/api/admin/events/:id",
        variant: "danger",
        type: "api",
        scope: "row",
        roles: ["admin"],
      },
      delete: {
        key: "delete",
        label: "Sil",
        apiAction: "delete",
        method: "DELETE",
        endpoint: "/api/events/:id",
        variant: "danger",
        type: "api",
        scope: "row",
        roles: ["admin"],
      },
    },
  },
  vacancies: {
    listEndpoint: "/api/vacancies?adminView=true",
    mapResponse: (data) => {
      const payload = data as {
        vacancies?: VacancyAdminItem[];
        page?: number;
        totalPages?: number;
        total?: number;
        limit?: number;
      };
      return {
        items: payload.vacancies || [],
        pagination: {
          page: payload.page || 1,
          totalPages: payload.totalPages || 1,
          total: payload.total || 0,
          limit: payload.limit || 10,
        },
      };
    },
    actions: {
      approve: {
        key: "approve",
        label: "Təsdiq Et",
        apiAction: "approve",
        method: "PATCH",
        endpoint: "/api/vacancies/:id",
        variant: "primary",
        type: "api",
        scope: "row",
        roles: ["admin"],
      },
      reject: {
        key: "reject",
        label: "Rədd Et",
        apiAction: "reject",
        method: "PATCH",
        endpoint: "/api/vacancies/:id",
        variant: "danger",
        type: "api",
        scope: "row",
        roles: ["admin"],
      },
      delete: {
        key: "delete",
        label: "Sil",
        apiAction: "delete",
        method: "DELETE",
        endpoint: "/api/vacancies/:id",
        variant: "danger",
        type: "api",
        scope: "row",
        roles: ["admin"],
      },
    },
  },
};

export const validateAdminConfig = (config: AdminConfigMap) => {
  const errors: string[] = [];
  const validScopes = new Set(["row", "bulk"]);
  Object.entries(config).forEach(([resourceKey, resource]) => {
    if (!resource.listEndpoint) {
      errors.push(`${resourceKey}: missing listEndpoint`);
    }
    if (typeof resource.mapResponse !== "function") {
      errors.push(`${resourceKey}: missing mapResponse function`);
    }
    if (!resource.actions || Object.keys(resource.actions).length === 0) {
      errors.push(`${resourceKey}: actions must be defined`);
      return;
    }
    Object.entries(resource.actions).forEach(([actionKey, action]) => {
      if (!action.key || !action.label || !action.type) {
        errors.push(
          `${resourceKey}.${actionKey}: missing required fields (key, label, type)`,
        );
      }
      if (action.key && action.key !== actionKey) {
        errors.push(
          `${resourceKey}.${actionKey}: action.key must match its object key`,
        );
      }
      if (action.scope && !validScopes.has(action.scope)) {
        errors.push(`${resourceKey}.${actionKey}: invalid scope "${action.scope}"`);
      }
      if (action.type === "api" && !action.method) {
        errors.push(`${resourceKey}.${actionKey}: api action missing method`);
      }
      if (
        action.type === "api" &&
        action.scope === "bulk" &&
        typeof action.getBody !== "function"
      ) {
        errors.push(
          `${resourceKey}.${actionKey}: bulk api action should define getBody`,
        );
      }
      if (action.type === "navigation" && !action.getHref) {
        errors.push(`${resourceKey}.${actionKey}: navigation action missing getHref`);
      }
      if (action.type === "modal" && !action.modalType) {
        errors.push(`${resourceKey}.${actionKey}: modal action missing modalType`);
      }
    });
  });
  return errors;
};

if (process.env.NODE_ENV !== "production") {
  const configErrors = validateAdminConfig(adminConfig);
  if (configErrors.length > 0) {
    console.error("Invalid admin config:\n" + configErrors.join("\n"));
  }
}
