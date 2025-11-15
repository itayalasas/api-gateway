export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      apis: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          base_url: string
          type: 'published' | 'external'
          auth_type: string
          auth_config: Json | null
          is_active: boolean
          created_at: string
          updated_at: string
          project_id: string | null
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          base_url: string
          type: 'published' | 'external'
          auth_type: string
          auth_config?: Json | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
          project_id?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string | null
          base_url?: string
          type?: 'published' | 'external'
          auth_type?: string
          auth_config?: Json | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
          project_id?: string | null
        }
      }
      api_endpoints: {
        Row: {
          id: string
          api_id: string
          path: string
          method: string
          description: string | null
          headers: Json | null
          body_schema: Json | null
          response_schema: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          api_id: string
          path: string
          method: string
          description?: string | null
          headers?: Json | null
          body_schema?: Json | null
          response_schema?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          api_id?: string
          path?: string
          method?: string
          description?: string | null
          headers?: Json | null
          body_schema?: Json | null
          response_schema?: Json | null
          created_at?: string
        }
      }
      integrations: {
        Row: {
          id: string
          name: string
          description: string
          user_id: string
          source_api_id: string | null
          target_api_id: string | null
          source_endpoint_id: string | null
          target_endpoint_id: string | null
          endpoint_path: string
          method: string
          integration_type: string
          transform_config: Json | null
          api_key: string | null
          custom_headers: Json | null
          forward_headers: string[] | null
          path_params_config: Json | null
          query_params_config: Json | null
          is_active: boolean
          created_at: string
          updated_at: string
          project_id: string | null
        }
        Insert: {
          id?: string
          name: string
          description?: string
          user_id: string
          source_api_id?: string | null
          target_api_id?: string | null
          source_endpoint_id?: string | null
          target_endpoint_id?: string | null
          endpoint_path: string
          method: string
          integration_type: string
          transform_config?: Json | null
          api_key?: string | null
          custom_headers?: Json | null
          forward_headers?: string[] | null
          path_params_config?: Json | null
          query_params_config?: Json | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
          project_id?: string | null
        }
        Update: {
          id?: string
          name?: string
          description?: string
          user_id?: string
          source_api_id?: string | null
          target_api_id?: string | null
          source_endpoint_id?: string | null
          target_endpoint_id?: string | null
          endpoint_path?: string
          method?: string
          integration_type?: string
          transform_config?: Json | null
          api_key?: string | null
          custom_headers?: Json | null
          forward_headers?: string[] | null
          path_params_config?: Json | null
          query_params_config?: Json | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
          project_id?: string | null
        }
      }
      request_logs: {
        Row: {
          id: string
          integration_id: string
          request_method: string
          request_path: string
          request_headers: Json | null
          request_body: Json | null
          response_status: number | null
          response_headers: Json | null
          response_body: Json | null
          error_message: string | null
          duration_ms: number | null
          created_at: string
        }
        Insert: {
          id?: string
          integration_id: string
          request_method: string
          request_path: string
          request_headers?: Json | null
          request_body?: Json | null
          response_status?: number | null
          response_headers?: Json | null
          response_body?: Json | null
          error_message?: string | null
          duration_ms?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          integration_id?: string
          request_method?: string
          request_path?: string
          request_headers?: Json | null
          request_body?: Json | null
          response_status?: number | null
          response_headers?: Json | null
          response_body?: Json | null
          error_message?: string | null
          duration_ms?: number | null
          created_at?: string
        }
      }
      system_config: {
        Row: {
          id: string
          key: string
          value: Json
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          key: string
          value: Json
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          key?: string
          value?: Json
          description?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      projects: {
        Row: {
          id: string
          name: string
          description: string
          color: string
          icon: string
          user_id: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string
          color?: string
          icon?: string
          user_id: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string
          color?: string
          icon?: string
          user_id?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      project_members: {
        Row: {
          id: string
          project_id: string
          user_id: string
          role: 'owner' | 'editor' | 'viewer'
          created_at: string
        }
        Insert: {
          id?: string
          project_id: string
          user_id: string
          role: 'owner' | 'editor' | 'viewer'
          created_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          user_id?: string
          role?: 'owner' | 'editor' | 'viewer'
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
