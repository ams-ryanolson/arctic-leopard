export type NotificationActor = {
    id: number | string;
    username: string;
    display_name: string | null;
    avatar_url: string | null;
};

export type NotificationSubject =
    | {
          type: 'post';
          id: number;
          author?: {
              id: number;
              username: string;
              display_name: string | null;
          } | null;
      }
    | {
          type: 'user';
          id: number | string | null;
      }
    | Record<string, unknown>
    | null;

export type NotificationMeta = Record<string, unknown>;

export type NotificationItem = {
    id: string;
    type: string;
    actor: NotificationActor | null;
    subject: NotificationSubject;
    meta: NotificationMeta;
    read_at: string | null;
    created_at: string | null;
    updated_at: string | null;
};

export type NotificationPage = {
    data: NotificationItem[];
    links: {
        first?: string | null;
        last?: string | null;
        prev?: string | null;
        next?: string | null;
    };
    meta: {
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        filter?: string;
    };
};

export type NotificationFilter = 'all' | 'unread';
