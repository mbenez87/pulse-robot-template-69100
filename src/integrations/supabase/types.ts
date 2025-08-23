export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      companies: {
        Row: {
          board_members: Json | null
          ceo: string | null
          company_background: string | null
          created_at: string
          customers: string | null
          description: string | null
          employees: number | null
          founded_year: number | null
          growth_rate: string | null
          id: number
          industry: string | null
          investors: Json | null
          location: string | null
          name: string
          stage: string | null
          total_invested: number | null
          updated_at: string
          valuation: number | null
          website: string | null
        }
        Insert: {
          board_members?: Json | null
          ceo?: string | null
          company_background?: string | null
          created_at?: string
          customers?: string | null
          description?: string | null
          employees?: number | null
          founded_year?: number | null
          growth_rate?: string | null
          id?: number
          industry?: string | null
          investors?: Json | null
          location?: string | null
          name: string
          stage?: string | null
          total_invested?: number | null
          updated_at?: string
          valuation?: number | null
          website?: string | null
        }
        Update: {
          board_members?: Json | null
          ceo?: string | null
          company_background?: string | null
          created_at?: string
          customers?: string | null
          description?: string | null
          employees?: number | null
          founded_year?: number | null
          growth_rate?: string | null
          id?: number
          industry?: string | null
          investors?: Json | null
          location?: string | null
          name?: string
          stage?: string | null
          total_invested?: number | null
          updated_at?: string
          valuation?: number | null
          website?: string | null
        }
        Relationships: []
      }
      company_metrics: {
        Row: {
          company_id: number | null
          created_at: string
          id: number
          metric_date: string | null
          metric_name: string | null
          metric_value: string | null
        }
        Insert: {
          company_id?: number | null
          created_at?: string
          id?: number
          metric_date?: string | null
          metric_name?: string | null
          metric_value?: string | null
        }
        Update: {
          company_id?: number | null
          created_at?: string
          id?: number
          metric_date?: string | null
          metric_name?: string | null
          metric_value?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_metrics_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_news: {
        Row: {
          company_id: number
          id: string
          news_article_id: string
        }
        Insert: {
          company_id: number
          id?: string
          news_article_id: string
        }
        Update: {
          company_id?: number
          id?: string
          news_article_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_news_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_news_news_article_id_fkey"
            columns: ["news_article_id"]
            isOneToOne: false
            referencedRelation: "news_articles"
            referencedColumns: ["id"]
          },
        ]
      }
      company_submissions: {
        Row: {
          company_name: string
          company_website: string | null
          created_at: string | null
          founder_email: string
          founder_name: string
          funding_stage: string | null
          id: string
          industry: string | null
          pitch: string | null
          status: string | null
        }
        Insert: {
          company_name: string
          company_website?: string | null
          created_at?: string | null
          founder_email: string
          founder_name: string
          funding_stage?: string | null
          id?: string
          industry?: string | null
          pitch?: string | null
          status?: string | null
        }
        Update: {
          company_name?: string
          company_website?: string | null
          created_at?: string | null
          founder_email?: string
          founder_name?: string
          funding_stage?: string | null
          id?: string
          industry?: string | null
          pitch?: string | null
          status?: string | null
        }
        Relationships: []
      }
      contact_messages: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string
          name: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
        }
        Relationships: []
      }
      data_room_files: {
        Row: {
          created_at: string
          data_room_id: string
          file_name: string
          file_size: number
          file_type: string
          id: string
          is_folder: boolean
          parent_folder_id: string | null
          storage_path: string
        }
        Insert: {
          created_at?: string
          data_room_id: string
          file_name: string
          file_size: number
          file_type: string
          id?: string
          is_folder?: boolean
          parent_folder_id?: string | null
          storage_path: string
        }
        Update: {
          created_at?: string
          data_room_id?: string
          file_name?: string
          file_size?: number
          file_type?: string
          id?: string
          is_folder?: boolean
          parent_folder_id?: string | null
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "data_room_files_data_room_id_fkey"
            columns: ["data_room_id"]
            isOneToOne: false
            referencedRelation: "data_rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "data_room_files_parent_folder_id_fkey"
            columns: ["parent_folder_id"]
            isOneToOne: false
            referencedRelation: "data_room_files"
            referencedColumns: ["id"]
          },
        ]
      }
      data_rooms: {
        Row: {
          company_id: number | null
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          company_id?: number | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          company_id?: number | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "data_rooms_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      document_shares: {
        Row: {
          created_at: string
          document_id: string
          id: string
          permission: string
          shared_by: string
          shared_with: string
        }
        Insert: {
          created_at?: string
          document_id: string
          id?: string
          permission?: string
          shared_by: string
          shared_with: string
        }
        Update: {
          created_at?: string
          document_id?: string
          id?: string
          permission?: string
          shared_by?: string
          shared_with?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_shares_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          ai_summary: string | null
          created_at: string
          file_name: string
          file_size: number
          file_type: string
          id: string
          is_folder: boolean
          parent_folder_id: string | null
          processing_status: string | null
          share_expires_at: string | null
          share_link: string | null
          shared_with: string[] | null
          storage_path: string
          tags: string[] | null
          updated_at: string
          upload_status: string | null
          user_id: string
        }
        Insert: {
          ai_summary?: string | null
          created_at?: string
          file_name: string
          file_size: number
          file_type: string
          id?: string
          is_folder?: boolean
          parent_folder_id?: string | null
          processing_status?: string | null
          share_expires_at?: string | null
          share_link?: string | null
          shared_with?: string[] | null
          storage_path: string
          tags?: string[] | null
          updated_at?: string
          upload_status?: string | null
          user_id: string
        }
        Update: {
          ai_summary?: string | null
          created_at?: string
          file_name?: string
          file_size?: number
          file_type?: string
          id?: string
          is_folder?: boolean
          parent_folder_id?: string | null
          processing_status?: string | null
          share_expires_at?: string | null
          share_link?: string | null
          shared_with?: string[] | null
          storage_path?: string
          tags?: string[] | null
          updated_at?: string
          upload_status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_parent_folder_id_fkey"
            columns: ["parent_folder_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          created_at: string | null
          description: string | null
          end_time: string | null
          id: string
          is_virtual: boolean | null
          location: string | null
          rsvp_link: string | null
          start_time: string
          title: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          end_time?: string | null
          id?: string
          is_virtual?: boolean | null
          location?: string | null
          rsvp_link?: string | null
          start_time: string
          title: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          end_time?: string | null
          id?: string
          is_virtual?: boolean | null
          location?: string | null
          rsvp_link?: string | null
          start_time?: string
          title?: string
        }
        Relationships: []
      }
      firm_updates: {
        Row: {
          category: string | null
          content: string | null
          created_at: string | null
          id: string
          title: string
        }
        Insert: {
          category?: string | null
          content?: string | null
          created_at?: string | null
          id?: string
          title: string
        }
        Update: {
          category?: string | null
          content?: string | null
          created_at?: string | null
          id?: string
          title?: string
        }
        Relationships: []
      }
      investments: {
        Row: {
          amount_invested: number | null
          company_id: number | null
          created_at: string
          id: number
          investment_date: string | null
          lead_investor: string | null
          notes: string | null
          round_type: string | null
          updated_at: string
          valuation: number | null
        }
        Insert: {
          amount_invested?: number | null
          company_id?: number | null
          created_at?: string
          id?: number
          investment_date?: string | null
          lead_investor?: string | null
          notes?: string | null
          round_type?: string | null
          updated_at?: string
          valuation?: number | null
        }
        Update: {
          amount_invested?: number | null
          company_id?: number | null
          created_at?: string
          id?: number
          investment_date?: string | null
          lead_investor?: string | null
          notes?: string | null
          round_type?: string | null
          updated_at?: string
          valuation?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "investments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      job_opportunities: {
        Row: {
          application_link: string | null
          company_name: string
          created_at: string | null
          description: string | null
          id: string
          location: string | null
          title: string
        }
        Insert: {
          application_link?: string | null
          company_name: string
          created_at?: string | null
          description?: string | null
          id?: string
          location?: string | null
          title: string
        }
        Update: {
          application_link?: string | null
          company_name?: string
          created_at?: string | null
          description?: string | null
          id?: string
          location?: string | null
          title?: string
        }
        Relationships: []
      }
      leadership_team: {
        Row: {
          accomplishments_and_awards: Json | null
          created_at: string | null
          display_order: number | null
          education: Json | null
          id: string
          image_url: string | null
          leadership_and_boards: Json | null
          linkedin_url: string | null
          media_and_news: Json | null
          name: string
          professional_background: Json | null
          tagline: string | null
          title: string
          twitter_url: string | null
          work_experience: Json | null
        }
        Insert: {
          accomplishments_and_awards?: Json | null
          created_at?: string | null
          display_order?: number | null
          education?: Json | null
          id?: string
          image_url?: string | null
          leadership_and_boards?: Json | null
          linkedin_url?: string | null
          media_and_news?: Json | null
          name: string
          professional_background?: Json | null
          tagline?: string | null
          title: string
          twitter_url?: string | null
          work_experience?: Json | null
        }
        Update: {
          accomplishments_and_awards?: Json | null
          created_at?: string | null
          display_order?: number | null
          education?: Json | null
          id?: string
          image_url?: string | null
          leadership_and_boards?: Json | null
          linkedin_url?: string | null
          media_and_news?: Json | null
          name?: string
          professional_background?: Json | null
          tagline?: string | null
          title?: string
          twitter_url?: string | null
          work_experience?: Json | null
        }
        Relationships: []
      }
      news_articles: {
        Row: {
          article_url: string
          author: string | null
          category: string | null
          created_at: string
          financial_impact: string | null
          headline: string
          id: string
          is_breaking_news: boolean | null
          market_significance: number | null
          publication_date: string
          sentiment: string | null
          source_name: string
          subheadline: string | null
          summary: string | null
        }
        Insert: {
          article_url: string
          author?: string | null
          category?: string | null
          created_at?: string
          financial_impact?: string | null
          headline: string
          id?: string
          is_breaking_news?: boolean | null
          market_significance?: number | null
          publication_date: string
          sentiment?: string | null
          source_name: string
          subheadline?: string | null
          summary?: string | null
        }
        Update: {
          article_url?: string
          author?: string | null
          category?: string | null
          created_at?: string
          financial_impact?: string | null
          headline?: string
          id?: string
          is_breaking_news?: boolean | null
          market_significance?: number | null
          publication_date?: string
          sentiment?: string | null
          source_name?: string
          subheadline?: string | null
          summary?: string | null
        }
        Relationships: []
      }
      partner_perks: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          redemption_link: string | null
          title: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          redemption_link?: string | null
          title: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          redemption_link?: string | null
          title?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          id: string
          trial_expires_at: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id: string
          trial_expires_at?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          trial_expires_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      stripe_prices: {
        Row: {
          active: boolean | null
          currency: string | null
          description: string | null
          id: string
          interval: string | null
          interval_count: number | null
          metadata: Json | null
          product_id: string | null
          trial_period_days: number | null
          type: string | null
          unit_amount: number | null
        }
        Insert: {
          active?: boolean | null
          currency?: string | null
          description?: string | null
          id: string
          interval?: string | null
          interval_count?: number | null
          metadata?: Json | null
          product_id?: string | null
          trial_period_days?: number | null
          type?: string | null
          unit_amount?: number | null
        }
        Update: {
          active?: boolean | null
          currency?: string | null
          description?: string | null
          id?: string
          interval?: string | null
          interval_count?: number | null
          metadata?: Json | null
          product_id?: string | null
          trial_period_days?: number | null
          type?: string | null
          unit_amount?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "stripe_prices_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "stripe_products"
            referencedColumns: ["id"]
          },
        ]
      }
      stripe_products: {
        Row: {
          active: boolean | null
          description: string | null
          id: string
          image: string | null
          metadata: Json | null
          name: string | null
        }
        Insert: {
          active?: boolean | null
          description?: string | null
          id: string
          image?: string | null
          metadata?: Json | null
          name?: string | null
        }
        Update: {
          active?: boolean | null
          description?: string | null
          id?: string
          image?: string | null
          metadata?: Json | null
          name?: string | null
        }
        Relationships: []
      }
      syndicate_invitations: {
        Row: {
          created_at: string | null
          email: string
          expires_at: string
          id: string
          status: string
          syndicate_id: string | null
          token: string
        }
        Insert: {
          created_at?: string | null
          email: string
          expires_at: string
          id?: string
          status?: string
          syndicate_id?: string | null
          token: string
        }
        Update: {
          created_at?: string | null
          email?: string
          expires_at?: string
          id?: string
          status?: string
          syndicate_id?: string | null
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "syndicate_invitations_syndicate_id_fkey"
            columns: ["syndicate_id"]
            isOneToOne: false
            referencedRelation: "syndicates"
            referencedColumns: ["id"]
          },
        ]
      }
      syndicates: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          lead: string
          name: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          lead: string
          name: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          lead?: string
          name?: string
          user_id?: string | null
        }
        Relationships: []
      }
      syndication_deals: {
        Row: {
          company_name: string
          created_at: string | null
          deal_room_link: string
          description: string | null
          id: string
          is_live: boolean | null
        }
        Insert: {
          company_name: string
          created_at?: string | null
          deal_room_link: string
          description?: string | null
          id?: string
          is_live?: boolean | null
        }
        Update: {
          company_name?: string
          created_at?: string | null
          deal_room_link?: string
          description?: string | null
          id?: string
          is_live?: boolean | null
        }
        Relationships: []
      }
      user_followed_companies: {
        Row: {
          company_id: number
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          company_id: number
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          company_id?: number
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_followed_companies_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      user_notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean | null
          message: string
          news_article_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          message: string
          news_article_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          message?: string
          news_article_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_notifications_news_article_id_fkey"
            columns: ["news_article_id"]
            isOneToOne: false
            referencedRelation: "news_articles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_subscriptions: {
        Row: {
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          status: string | null
          stripe_customer_id: string | null
          stripe_price_id: string | null
          stripe_subscription_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          status?: string | null
          stripe_customer_id?: string | null
          stripe_price_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          status?: string | null
          stripe_customer_id?: string | null
          stripe_price_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      venture_debt_referrals: {
        Row: {
          company_name: string
          contact_email: string | null
          contact_person: string | null
          created_at: string | null
          funding_needs: string | null
          id: string
          notes: string | null
          partner_id: string | null
          status: string | null
        }
        Insert: {
          company_name: string
          contact_email?: string | null
          contact_person?: string | null
          created_at?: string | null
          funding_needs?: string | null
          id?: string
          notes?: string | null
          partner_id?: string | null
          status?: string | null
        }
        Update: {
          company_name?: string
          contact_email?: string | null
          contact_person?: string | null
          created_at?: string | null
          funding_needs?: string | null
          id?: string
          notes?: string | null
          partner_id?: string | null
          status?: string | null
        }
        Relationships: []
      }
      venture_partners: {
        Row: {
          company: string
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          linkedin: string | null
          name: string
          title: string
        }
        Insert: {
          company: string
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          linkedin?: string | null
          name: string
          title: string
        }
        Update: {
          company?: string
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          linkedin?: string | null
          name?: string
          title?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      binary_quantize: {
        Args: { "": string } | { "": unknown }
        Returns: unknown
      }
      delete_folder_and_contents: {
        Args: { folder_id_to_delete: string }
        Returns: undefined
      }
      get_folder_contents: {
        Args: { folder_id?: string }
        Returns: {
          created_at: string
          file_name: string
          file_size: number
          file_type: string
          id: string
          is_folder: boolean
          storage_path: string
          updated_at: string
        }[]
      }
      get_industry_breakdown: {
        Args: Record<PropertyKey, never>
        Returns: {
          company_count: number
          industry: string
          total_invested: number
        }[]
      }
      get_investment_trends: {
        Args: Record<PropertyKey, never>
        Returns: {
          investment_count: number
          month: number
          total_amount: number
          year: number
        }[]
      }
      get_leadership_team_public: {
        Args: Record<PropertyKey, never>
        Returns: {
          accomplishments_and_awards: Json
          created_at: string
          display_order: number
          education: Json
          id: string
          image_url: string
          leadership_and_boards: Json
          linkedin_url: string
          media_and_news: Json
          name: string
          professional_background: Json
          tagline: string
          title: string
          twitter_url: string
          work_experience: Json
        }[]
      }
      get_portfolio_overview: {
        Args: Record<PropertyKey, never>
        Returns: {
          avg_investment: number
          industries_count: number
          total_companies: number
          total_invested: number
          total_investments: number
        }[]
      }
      get_stage_analysis: {
        Args: Record<PropertyKey, never>
        Returns: {
          avg_investment: number
          company_count: number
          stage: string
          total_invested: number
        }[]
      }
      halfvec_avg: {
        Args: { "": number[] }
        Returns: unknown
      }
      halfvec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      halfvec_send: {
        Args: { "": unknown }
        Returns: string
      }
      halfvec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      hnsw_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_sparsevec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnswhandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflat_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflat_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflathandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      l2_norm: {
        Args: { "": unknown } | { "": unknown }
        Returns: number
      }
      l2_normalize: {
        Args: { "": string } | { "": unknown } | { "": unknown }
        Returns: string
      }
      search_document_chunks: {
        Args: {
          filter_org_id?: string
          filter_owner_id?: string
          filter_room_ids?: string[]
          match_count?: number
          match_threshold?: number
          query_embedding: string
        }
        Returns: {
          chunk_id: string
          chunk_index: number
          created_at: string
          document_id: string
          documents: Json
          embedding: string
          id: string
          metadata: Json
          org_id: string
          owner_id: string
          room_id: string
          similarity: number
          text_content: string
        }[]
      }
      sparsevec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      sparsevec_send: {
        Args: { "": unknown }
        Returns: string
      }
      sparsevec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      vector_avg: {
        Args: { "": number[] }
        Returns: string
      }
      vector_dims: {
        Args: { "": string } | { "": unknown }
        Returns: number
      }
      vector_norm: {
        Args: { "": string }
        Returns: number
      }
      vector_out: {
        Args: { "": string }
        Returns: unknown
      }
      vector_send: {
        Args: { "": string }
        Returns: string
      }
      vector_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
