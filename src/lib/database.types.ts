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
          description: string
          type: 'published' | 'external'
          base_url: string
          application_owner: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string
          type: 'published' | 'external'
          base_url: string
          application_owner?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string
          type?: 'published' | 'external'
          base_url?: string
          application_owner?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      api_endpoints: {
        Row: {
          id: string
          api_id: string
          path: string
          method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
          description: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          api_id: string
          path: string
          method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
          description?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          api_id?: string
          path?: string
          method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
          description?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      api_security: {
        Row: {
          id: string
          api_id: string
          auth_type: 'none' | 'api_key' | 'bearer_token' | 'basic_auth' | 'custom'
          auth_config: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          api_id: string
          auth_type?: 'none' | 'api_key' | 'bearer_token' | 'basic_auth' | 'custom'
          auth_config?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          api_id?: string
          auth_type?: 'none' | 'api_key' | 'bearer_token' | 'basic_auth' | 'custom'
          auth_config?: Json
          created_at?: string
          updated_at?: string
        }
      }
      integrations: {
        Row: {
          id: string
          user_id: string
          name: string
          source_api_id: string
          target_api_id: string
          source_endpoint_id: string | null
          target_endpoint_id: string | null
          endpoint_path: string
          method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
          is_active: boolean
          transform_config: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          source_api_id: string
          target_api_id: string
          source_endpoint_id?: string | null
          target_endpoint_id?: string | null
          endpoint_path: string
          method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
          is_active?: boolean
          transform_config?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          source_api_id?: string
          target_api_id?: string
          source_endpoint_id?: string | null
          target_endpoint_id?: string | null
          endpoint_path?: string
          method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
          is_active?: boolean
          transform_config?: Json
          created_at?: string
          updated_at?: string
        }
      }
      request_logs: {
        Row: {
          id: string
          integration_id: string
          request_id: string
          method: string
          path: string
          headers: Json
          body: Json
          response_status: number | null
          response_body: Json
          response_time_ms: number | null
          error_message: string | null
          created_at: string
        }
        Insert: {
          id?: string
          integration_id: string
          request_id: string
          method: string
          path: string
          headers?: Json
          body?: Json
          response_status?: number | null
          response_body?: Json
          response_time_ms?: number | null
          error_message?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          integration_id?: string
          request_id?: string
          method?: string
          path?: string
          headers?: Json
          body?: Json
          response_status?: number | null
          response_body?: Json
          response_time_ms?: number | null
          error_message?: string | null
          created_at?: string
        }
      }
      health_checks: {
        Row: {
          id: string
          api_id: string
          status: 'healthy' | 'unhealthy' | 'checking'
          response_time_ms: number | null
          status_code: number | null
          error_message: string | null
          checked_at: string
        }
        Insert: {
          id?: string
          api_id: string
          status?: 'healthy' | 'unhealthy' | 'checking'
          response_time_ms?: number | null
          status_code?: number | null
          error_message?: string | null
          checked_at?: string
        }
        Update: {
          id?: string
          api_id?: string
          status?: 'healthy' | 'unhealthy' | 'checking'
          response_time_ms?: number | null
          status_code?: number | null
          error_message?: string | null
          checked_at?: string
        }
      }
    }
  }
}
