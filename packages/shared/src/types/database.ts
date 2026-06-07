export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

type Relationship = {
  foreignKeyName: string;
  columns: string[];
  referencedRelation: string;
  referencedColumns: string[];
};

type TableDef<Row, Insert = Row, Update = Partial<Row>> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: Relationship[];
};

type InsertWithId<T, OmitKeys extends keyof T = never> = { id?: string } & Omit<T, 'id' | 'created_at' | OmitKeys>;

export interface Database {
  public: {
    Tables: {
      users: TableDef<User, InsertWithId<User>>;
      posts: TableDef<Post, InsertWithId<Post>>;
      likes: TableDef<Like, InsertWithId<Like>>;
      comments: TableDef<Comment, InsertWithId<Comment>>;
      stories: TableDef<Story, InsertWithId<Story>>;
      follows: TableDef<Follow, InsertWithId<Follow>>;
      conversations: TableDef<Conversation, InsertWithId<Conversation>>;
      conversation_participants: TableDef<ConversationParticipant, { id?: string } & Omit<ConversationParticipant, 'id'>>;
      messages: TableDef<Message, InsertWithId<Message, 'read_at'>>;
      notifications: TableDef<Notification, InsertWithId<Notification>>;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

export interface User {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  email: string;
  created_at: string;
}

export interface Post {
  id: string;
  user_id: string;
  image_url: string;
  caption: string | null;
  location: string | null;
  created_at: string;
}

export interface Like {
  id: string;
  user_id: string;
  post_id: string;
  created_at: string;
}

export interface Comment {
  id: string;
  user_id: string;
  post_id: string;
  content: string;
  created_at: string;
}

export interface Story {
  id: string;
  user_id: string;
  image_url: string;
  expires_at: string;
  created_at: string;
}

export interface Follow {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: string;
}

export interface Conversation {
  id: string;
  created_at: string;
  last_message_at: string | null;
}

export interface ConversationParticipant {
  id: string;
  conversation_id: string;
  user_id: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string | null;
  image_url: string | null;
  created_at: string;
  read_at: string | null;
}

export interface Notification {
  id: string;
  user_id: string;
  type: 'like' | 'comment' | 'follow' | 'message' | 'story_reply';
  actor_id: string;
  post_id: string | null;
  read: boolean;
  created_at: string;
}
