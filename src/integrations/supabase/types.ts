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
      ai_audit_log: {
        Row: {
          citations: Json | null
          created_at: string
          id: string
          inputs_hash: string | null
          mode: string | null
          model_name: string
          model_provider: string
          org_id: string | null
          outputs_hash: string | null
          query: string
          room_id: string | null
          source_doc_ids: string[] | null
          sources: string[] | null
          user_id: string
        }
        Insert: {
          citations?: Json | null
          created_at?: string
          id?: string
          inputs_hash?: string | null
          mode?: string | null
          model_name: string
          model_provider: string
          org_id?: string | null
          outputs_hash?: string | null
          query: string
          room_id?: string | null
          source_doc_ids?: string[] | null
          sources?: string[] | null
          user_id: string
        }
        Update: {
          citations?: Json | null
          created_at?: string
          id?: string
          inputs_hash?: string | null
          mode?: string | null
          model_name?: string
          model_provider?: string
          org_id?: string | null
          outputs_hash?: string | null
          query?: string
          room_id?: string | null
          source_doc_ids?: string[] | null
          sources?: string[] | null
          user_id?: string
        }
        Relationships: []
      }
      api_keys: {
        Row: {
          created_at: string | null
          created_by: string
          id: string
          is_active: boolean | null
          key_hash: string
          org_id: string
          service_name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by: string
          id?: string
          is_active?: boolean | null
          key_hash: string
          org_id: string
          service_name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string
          id?: string
          is_active?: boolean | null
          key_hash?: string
          org_id?: string
          service_name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
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
      contract_extractions: {
        Row: {
          created_at: string | null
          document_id: string
          extraction_confidence: number | null
          extraction_model: string
          governing_law: Json | null
          id: string
          indemnity_clauses: Json | null
          ip_provisions: Json | null
          liability_cap: Json | null
          parties: Json
          pricing: Json
          renewal_terms: Json | null
          risk_rationale: string
          risk_score: number
          term_details: Json
          termination_clauses: Json | null
          unusual_clauses: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          document_id: string
          extraction_confidence?: number | null
          extraction_model: string
          governing_law?: Json | null
          id?: string
          indemnity_clauses?: Json | null
          ip_provisions?: Json | null
          liability_cap?: Json | null
          parties: Json
          pricing: Json
          renewal_terms?: Json | null
          risk_rationale: string
          risk_score: number
          term_details: Json
          termination_clauses?: Json | null
          unusual_clauses?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          document_id?: string
          extraction_confidence?: number | null
          extraction_model?: string
          governing_law?: Json | null
          id?: string
          indemnity_clauses?: Json | null
          ip_provisions?: Json | null
          liability_cap?: Json | null
          parties?: Json
          pricing?: Json
          renewal_terms?: Json | null
          risk_rationale?: string
          risk_score?: number
          term_details?: Json
          termination_clauses?: Json | null
          unusual_clauses?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contract_extractions_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_obligations: {
        Row: {
          completed_at: string | null
          contract_extraction_id: string
          created_at: string | null
          description: string
          due_date: string
          id: string
          notes: string | null
          notification_date: string | null
          notification_sent: boolean | null
          obligation_type: string
          priority: string | null
          responsible_party: string
          status: string | null
          threshold_amount: number | null
          threshold_metric: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          contract_extraction_id: string
          created_at?: string | null
          description: string
          due_date: string
          id?: string
          notes?: string | null
          notification_date?: string | null
          notification_sent?: boolean | null
          obligation_type: string
          priority?: string | null
          responsible_party: string
          status?: string | null
          threshold_amount?: number | null
          threshold_metric?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          contract_extraction_id?: string
          created_at?: string | null
          description?: string
          due_date?: string
          id?: string
          notes?: string | null
          notification_date?: string | null
          notification_sent?: boolean | null
          obligation_type?: string
          priority?: string | null
          responsible_party?: string
          status?: string | null
          threshold_amount?: number | null
          threshold_metric?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contract_obligations_contract_extraction_id_fkey"
            columns: ["contract_extraction_id"]
            isOneToOne: false
            referencedRelation: "contract_extractions"
            referencedColumns: ["id"]
          },
        ]
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
      doc_lineage: {
        Row: {
          derived_document_id: string
          id: string
          operation_details: Json
          operation_type: string
          parent_document_id: string
          performed_at: string | null
          performed_by: string
        }
        Insert: {
          derived_document_id: string
          id?: string
          operation_details: Json
          operation_type: string
          parent_document_id: string
          performed_at?: string | null
          performed_by: string
        }
        Update: {
          derived_document_id?: string
          id?: string
          operation_details?: Json
          operation_type?: string
          parent_document_id?: string
          performed_at?: string | null
          performed_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "doc_lineage_derived_document_id_fkey"
            columns: ["derived_document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "doc_lineage_parent_document_id_fkey"
            columns: ["parent_document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      document_chunks: {
        Row: {
          chunk_id: string
          chunk_index: number
          confidence: number | null
          created_at: string | null
          document_id: string
          embedding: string | null
          id: string
          metadata: Json | null
          org_id: string
          owner_id: string
          processing_method: string | null
          room_id: string | null
          source_block_id: string | null
          source_page: number | null
          text_content: string
        }
        Insert: {
          chunk_id: string
          chunk_index?: number
          confidence?: number | null
          created_at?: string | null
          document_id: string
          embedding?: string | null
          id?: string
          metadata?: Json | null
          org_id?: string
          owner_id: string
          processing_method?: string | null
          room_id?: string | null
          source_block_id?: string | null
          source_page?: number | null
          text_content: string
        }
        Update: {
          chunk_id?: string
          chunk_index?: number
          confidence?: number | null
          created_at?: string | null
          document_id?: string
          embedding?: string | null
          id?: string
          metadata?: Json | null
          org_id?: string
          owner_id?: string
          processing_method?: string | null
          room_id?: string | null
          source_block_id?: string | null
          source_page?: number | null
          text_content?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_chunks_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_source_block_id"
            columns: ["source_block_id"]
            isOneToOne: false
            referencedRelation: "ocr_blocks"
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
          camera_make: string | null
          camera_model: string | null
          capture_at: string | null
          category: string | null
          created_at: string
          duration_seconds: number | null
          file_name: string
          file_size: number
          file_type: string
          gps_lat: number | null
          gps_lon: number | null
          height: number | null
          id: string
          is_folder: boolean
          meta: Json | null
          org_id: string
          parent_folder_id: string | null
          path: string | null
          processing_status: string | null
          room_id: string | null
          share_expires_at: string | null
          share_link: string | null
          shared_with: string[] | null
          storage_path: string
          tags: string[] | null
          title: string | null
          updated_at: string
          upload_status: string | null
          user_id: string
          width: number | null
        }
        Insert: {
          ai_summary?: string | null
          camera_make?: string | null
          camera_model?: string | null
          capture_at?: string | null
          category?: string | null
          created_at?: string
          duration_seconds?: number | null
          file_name: string
          file_size: number
          file_type: string
          gps_lat?: number | null
          gps_lon?: number | null
          height?: number | null
          id?: string
          is_folder?: boolean
          meta?: Json | null
          org_id?: string
          parent_folder_id?: string | null
          path?: string | null
          processing_status?: string | null
          room_id?: string | null
          share_expires_at?: string | null
          share_link?: string | null
          shared_with?: string[] | null
          storage_path: string
          tags?: string[] | null
          title?: string | null
          updated_at?: string
          upload_status?: string | null
          user_id: string
          width?: number | null
        }
        Update: {
          ai_summary?: string | null
          camera_make?: string | null
          camera_model?: string | null
          capture_at?: string | null
          category?: string | null
          created_at?: string
          duration_seconds?: number | null
          file_name?: string
          file_size?: number
          file_type?: string
          gps_lat?: number | null
          gps_lon?: number | null
          height?: number | null
          id?: string
          is_folder?: boolean
          meta?: Json | null
          org_id?: string
          parent_folder_id?: string | null
          path?: string | null
          processing_status?: string | null
          room_id?: string | null
          share_expires_at?: string | null
          share_link?: string | null
          shared_with?: string[] | null
          storage_path?: string
          tags?: string[] | null
          title?: string | null
          updated_at?: string
          upload_status?: string | null
          user_id?: string
          width?: number | null
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
            foreignKeyName: "documents_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
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
      ocr_blocks: {
        Row: {
          block_index: number
          block_type: string | null
          bounding_box: Json | null
          confidence: number | null
          created_at: string | null
          id: string
          metadata: Json | null
          ocr_page_id: string
          text_content: string
        }
        Insert: {
          block_index: number
          block_type?: string | null
          bounding_box?: Json | null
          confidence?: number | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          ocr_page_id: string
          text_content: string
        }
        Update: {
          block_index?: number
          block_type?: string | null
          bounding_box?: Json | null
          confidence?: number | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          ocr_page_id?: string
          text_content?: string
        }
        Relationships: [
          {
            foreignKeyName: "ocr_blocks_ocr_page_id_fkey"
            columns: ["ocr_page_id"]
            isOneToOne: false
            referencedRelation: "ocr_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      ocr_pages: {
        Row: {
          confidence: number | null
          created_at: string | null
          document_id: string
          id: string
          language: string | null
          metadata: Json | null
          page_number: number
          processing_method: string | null
          raw_text: string | null
        }
        Insert: {
          confidence?: number | null
          created_at?: string | null
          document_id: string
          id?: string
          language?: string | null
          metadata?: Json | null
          page_number: number
          processing_method?: string | null
          raw_text?: string | null
        }
        Update: {
          confidence?: number | null
          created_at?: string | null
          document_id?: string
          id?: string
          language?: string | null
          metadata?: Json | null
          page_number?: number
          processing_method?: string | null
          raw_text?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ocr_pages_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
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
      pii_detections: {
        Row: {
          bounding_box: Json | null
          confidence: number
          created_at: string | null
          detection_type: string
          document_id: string
          entity_type: string
          id: string
          ocr_block_id: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
          text_content: string
        }
        Insert: {
          bounding_box?: Json | null
          confidence: number
          created_at?: string | null
          detection_type: string
          document_id: string
          entity_type: string
          id?: string
          ocr_block_id?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          text_content: string
        }
        Update: {
          bounding_box?: Json | null
          confidence?: number
          created_at?: string | null
          detection_type?: string
          document_id?: string
          entity_type?: string
          id?: string
          ocr_block_id?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          text_content?: string
        }
        Relationships: [
          {
            foreignKeyName: "pii_detections_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pii_detections_ocr_block_id_fkey"
            columns: ["ocr_block_id"]
            isOneToOne: false
            referencedRelation: "ocr_blocks"
            referencedColumns: ["id"]
          },
        ]
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
      revenue_forecasts: {
        Row: {
          acv: number | null
          ai_narrative: string | null
          arr: number | null
          assumptions: string | null
          confidence_score: number | null
          contract_extraction_id: string
          created_at: string | null
          forecast_month: string
          id: string
          projected_revenue: number
          user_id: string
          variance_from_previous: number | null
          variance_percentage: number | null
        }
        Insert: {
          acv?: number | null
          ai_narrative?: string | null
          arr?: number | null
          assumptions?: string | null
          confidence_score?: number | null
          contract_extraction_id: string
          created_at?: string | null
          forecast_month: string
          id?: string
          projected_revenue: number
          user_id: string
          variance_from_previous?: number | null
          variance_percentage?: number | null
        }
        Update: {
          acv?: number | null
          ai_narrative?: string | null
          arr?: number | null
          assumptions?: string | null
          confidence_score?: number | null
          contract_extraction_id?: string
          created_at?: string | null
          forecast_month?: string
          id?: string
          projected_revenue?: number
          user_id?: string
          variance_from_previous?: number | null
          variance_percentage?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "revenue_forecasts_contract_extraction_id_fkey"
            columns: ["contract_extraction_id"]
            isOneToOne: false
            referencedRelation: "contract_extractions"
            referencedColumns: ["id"]
          },
        ]
      }
      revenue_terms: {
        Row: {
          billing_frequency: string
          contract_extraction_id: string
          created_at: string | null
          currency: string | null
          end_date: string | null
          escalation_rate: number | null
          id: string
          minimum_commitment: number | null
          product_name: string | null
          quantity: number
          ramp_schedule: Json | null
          sku: string
          start_date: string
          term_months: number | null
          unit_price: number
          updated_at: string | null
          usage_based: boolean | null
          usage_tiers: Json | null
          user_id: string
        }
        Insert: {
          billing_frequency: string
          contract_extraction_id: string
          created_at?: string | null
          currency?: string | null
          end_date?: string | null
          escalation_rate?: number | null
          id?: string
          minimum_commitment?: number | null
          product_name?: string | null
          quantity: number
          ramp_schedule?: Json | null
          sku: string
          start_date: string
          term_months?: number | null
          unit_price: number
          updated_at?: string | null
          usage_based?: boolean | null
          usage_tiers?: Json | null
          user_id: string
        }
        Update: {
          billing_frequency?: string
          contract_extraction_id?: string
          created_at?: string | null
          currency?: string | null
          end_date?: string | null
          escalation_rate?: number | null
          id?: string
          minimum_commitment?: number | null
          product_name?: string | null
          quantity?: number
          ramp_schedule?: Json | null
          sku?: string
          start_date?: string
          term_months?: number | null
          unit_price?: number
          updated_at?: string | null
          usage_based?: boolean | null
          usage_tiers?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "revenue_terms_contract_extraction_id_fkey"
            columns: ["contract_extraction_id"]
            isOneToOne: false
            referencedRelation: "contract_extractions"
            referencedColumns: ["id"]
          },
        ]
      }
      room_tokens: {
        Row: {
          created_at: string | null
          created_by: string
          expires_at: string
          id: string
          last_used_at: string | null
          permissions: Json | null
          room_id: string
          token_hash: string
        }
        Insert: {
          created_at?: string | null
          created_by: string
          expires_at: string
          id?: string
          last_used_at?: string | null
          permissions?: Json | null
          room_id: string
          token_hash: string
        }
        Update: {
          created_at?: string | null
          created_by?: string
          expires_at?: string
          id?: string
          last_used_at?: string | null
          permissions?: Json | null
          room_id?: string
          token_hash?: string
        }
        Relationships: [
          {
            foreignKeyName: "room_tokens_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      rooms: {
        Row: {
          answer_only_mode: boolean | null
          created_at: string | null
          description: string | null
          id: string
          name: string
          org_id: string
          owner_id: string
          settings: Json | null
          updated_at: string | null
        }
        Insert: {
          answer_only_mode?: boolean | null
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          org_id: string
          owner_id: string
          settings?: Json | null
          updated_at?: string | null
        }
        Update: {
          answer_only_mode?: boolean | null
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          org_id?: string
          owner_id?: string
          settings?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      schema_history: {
        Row: {
          ai_model: string
          approved_at: string | null
          confidence_score: number | null
          created_at: string | null
          document_id: string
          id: string
          implemented_at: string | null
          migration_sql: string | null
          rejected_reason: string | null
          schema_description: string | null
          status: string | null
          suggested_schema: Json
          table_names: string[] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          ai_model: string
          approved_at?: string | null
          confidence_score?: number | null
          created_at?: string | null
          document_id: string
          id?: string
          implemented_at?: string | null
          migration_sql?: string | null
          rejected_reason?: string | null
          schema_description?: string | null
          status?: string | null
          suggested_schema: Json
          table_names?: string[] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          ai_model?: string
          approved_at?: string | null
          confidence_score?: number | null
          created_at?: string | null
          document_id?: string
          id?: string
          implemented_at?: string | null
          migration_sql?: string | null
          rejected_reason?: string | null
          schema_description?: string | null
          status?: string | null
          suggested_schema?: Json
          table_names?: string[] | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "schema_history_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      share_tokens: {
        Row: {
          created_at: string | null
          expires_at: string
          org_id: string
          room_id: string | null
          scope: string
          token: string
        }
        Insert: {
          created_at?: string | null
          expires_at: string
          org_id: string
          room_id?: string | null
          scope: string
          token: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string
          org_id?: string
          room_id?: string | null
          scope?: string
          token?: string
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
      user_prefs: {
        Row: {
          aria_mode: string | null
          aria_model: string
          updated_at: string
          user_id: string
          verifier_enabled: boolean | null
        }
        Insert: {
          aria_mode?: string | null
          aria_model?: string
          updated_at?: string
          user_id: string
          verifier_enabled?: boolean | null
        }
        Update: {
          aria_mode?: string | null
          aria_model?: string
          updated_at?: string
          user_id?: string
          verifier_enabled?: boolean | null
        }
        Relationships: []
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
      work_queue: {
        Row: {
          assigned_to: string | null
          completed_at: string | null
          created_at: string | null
          description: string
          due_date: string | null
          email_draft: string | null
          id: string
          obligation_id: string | null
          priority: string | null
          status: string | null
          task_type: string
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string | null
          description: string
          due_date?: string | null
          email_draft?: string | null
          id?: string
          obligation_id?: string | null
          priority?: string | null
          status?: string | null
          task_type: string
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string | null
          description?: string
          due_date?: string | null
          email_draft?: string | null
          id?: string
          obligation_id?: string | null
          priority?: string | null
          status?: string | null
          task_type?: string
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_queue_obligation_id_fkey"
            columns: ["obligation_id"]
            isOneToOne: false
            referencedRelation: "contract_obligations"
            referencedColumns: ["id"]
          },
        ]
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
      compute_revenue_forecast: {
        Args: { p_contract_extraction_id: string; p_forecast_months?: number }
        Returns: undefined
      }
      counts_by_category: {
        Args: { p_owner: string }
        Returns: {
          category: string
          count: number
        }[]
      }
      delete_folder_and_contents: {
        Args: { folder_id_to_delete: string }
        Returns: undefined
      }
      doc_category: {
        Args: { mime: string; name: string }
        Returns: string
      }
      generate_share_token: {
        Args: Record<PropertyKey, never>
        Returns: string
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
      hybrid_search_chunks: {
        Args: {
          doc_filter?: string[]
          match_count?: number
          match_threshold?: number
          org_filter: string
          query_embedding: string
          query_text: string
          room_filter?: string
        }
        Returns: {
          chunk_id: string
          chunk_index: number
          doc_path: string
          doc_title: string
          document_id: string
          page_number: number
          similarity: number
          text_content: string
        }[]
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
