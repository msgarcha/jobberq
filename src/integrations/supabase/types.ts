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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      client_saved_cards: {
        Row: {
          card_brand: string | null
          card_exp_month: number | null
          card_exp_year: number | null
          card_last4: string | null
          client_id: string
          created_at: string | null
          id: string
          is_default: boolean | null
          stripe_customer_id: string
          stripe_payment_method_id: string
          team_id: string | null
          user_id: string
        }
        Insert: {
          card_brand?: string | null
          card_exp_month?: number | null
          card_exp_year?: number | null
          card_last4?: string | null
          client_id: string
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          stripe_customer_id: string
          stripe_payment_method_id: string
          team_id?: string | null
          user_id: string
        }
        Update: {
          card_brand?: string | null
          card_exp_month?: number | null
          card_exp_year?: number | null
          card_last4?: string | null
          client_id?: string
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          stripe_customer_id?: string
          stripe_payment_method_id?: string
          team_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_saved_cards_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_saved_cards_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          address_line1: string | null
          address_line2: string | null
          city: string | null
          company_name: string | null
          country: string | null
          created_at: string
          default_payment_terms: string | null
          email: string | null
          first_name: string
          id: string
          last_name: string
          lead_source: string | null
          notes: string | null
          phone: string | null
          state: string | null
          status: Database["public"]["Enums"]["client_status"]
          tags: string[] | null
          team_id: string | null
          title: string | null
          updated_at: string
          user_id: string
          zip: string | null
        }
        Insert: {
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          company_name?: string | null
          country?: string | null
          created_at?: string
          default_payment_terms?: string | null
          email?: string | null
          first_name: string
          id?: string
          last_name: string
          lead_source?: string | null
          notes?: string | null
          phone?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["client_status"]
          tags?: string[] | null
          team_id?: string | null
          title?: string | null
          updated_at?: string
          user_id: string
          zip?: string | null
        }
        Update: {
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          company_name?: string | null
          country?: string | null
          created_at?: string
          default_payment_terms?: string | null
          email?: string | null
          first_name?: string
          id?: string
          last_name?: string
          lead_source?: string | null
          notes?: string | null
          phone?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["client_status"]
          tags?: string[] | null
          team_id?: string | null
          title?: string | null
          updated_at?: string
          user_id?: string
          zip?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clients_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      company_settings: {
        Row: {
          address_line1: string | null
          address_line2: string | null
          city: string | null
          company_name: string | null
          country: string | null
          created_at: string
          default_payment_terms: string | null
          default_tax_rate: number | null
          email: string | null
          google_place_id: string | null
          google_review_url: string | null
          id: string
          invoice_prefix: string | null
          job_prefix: string | null
          logo_url: string | null
          next_invoice_number: number | null
          next_job_number: number | null
          next_quote_number: number | null
          notify_low_ratings: boolean
          payout_schedule: string | null
          pdf_accent_color: string | null
          pdf_primary_color: string | null
          pdf_style: string | null
          phone: string | null
          quote_prefix: string | null
          review_gating_enabled: boolean
          review_min_stars: number
          state: string | null
          stripe_account_id: string | null
          stripe_charges_enabled: boolean
          stripe_onboarding_complete: boolean
          stripe_payouts_enabled: boolean
          team_id: string | null
          updated_at: string
          user_id: string
          website: string | null
          zip: string | null
        }
        Insert: {
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          company_name?: string | null
          country?: string | null
          created_at?: string
          default_payment_terms?: string | null
          default_tax_rate?: number | null
          email?: string | null
          google_place_id?: string | null
          google_review_url?: string | null
          id?: string
          invoice_prefix?: string | null
          job_prefix?: string | null
          logo_url?: string | null
          next_invoice_number?: number | null
          next_job_number?: number | null
          next_quote_number?: number | null
          notify_low_ratings?: boolean
          payout_schedule?: string | null
          pdf_accent_color?: string | null
          pdf_primary_color?: string | null
          pdf_style?: string | null
          phone?: string | null
          quote_prefix?: string | null
          review_gating_enabled?: boolean
          review_min_stars?: number
          state?: string | null
          stripe_account_id?: string | null
          stripe_charges_enabled?: boolean
          stripe_onboarding_complete?: boolean
          stripe_payouts_enabled?: boolean
          team_id?: string | null
          updated_at?: string
          user_id: string
          website?: string | null
          zip?: string | null
        }
        Update: {
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          company_name?: string | null
          country?: string | null
          created_at?: string
          default_payment_terms?: string | null
          default_tax_rate?: number | null
          email?: string | null
          google_place_id?: string | null
          google_review_url?: string | null
          id?: string
          invoice_prefix?: string | null
          job_prefix?: string | null
          logo_url?: string | null
          next_invoice_number?: number | null
          next_job_number?: number | null
          next_quote_number?: number | null
          notify_low_ratings?: boolean
          payout_schedule?: string | null
          pdf_accent_color?: string | null
          pdf_primary_color?: string | null
          pdf_style?: string | null
          phone?: string | null
          quote_prefix?: string | null
          review_gating_enabled?: boolean
          review_min_stars?: number
          state?: string | null
          stripe_account_id?: string | null
          stripe_charges_enabled?: boolean
          stripe_onboarding_complete?: boolean
          stripe_payouts_enabled?: boolean
          team_id?: string | null
          updated_at?: string
          user_id?: string
          website?: string | null
          zip?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_settings_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      connect_products: {
        Row: {
          connected_account_id: string
          created_at: string
          currency: string
          description: string | null
          id: string
          name: string
          price_cents: number
          stripe_price_id: string | null
          stripe_product_id: string
          team_id: string | null
          user_id: string
        }
        Insert: {
          connected_account_id: string
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          name: string
          price_cents?: number
          stripe_price_id?: string | null
          stripe_product_id: string
          team_id?: string | null
          user_id: string
        }
        Update: {
          connected_account_id?: string
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          name?: string
          price_cents?: number
          stripe_price_id?: string | null
          stripe_product_id?: string
          team_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "connect_products_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      connected_accounts: {
        Row: {
          contact_email: string | null
          created_at: string
          display_name: string
          id: string
          stripe_account_id: string
          team_id: string | null
          user_id: string
        }
        Insert: {
          contact_email?: string | null
          created_at?: string
          display_name: string
          id?: string
          stripe_account_id: string
          team_id?: string | null
          user_id: string
        }
        Update: {
          contact_email?: string | null
          created_at?: string
          display_name?: string
          id?: string
          stripe_account_id?: string
          team_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "connected_accounts_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      invoice_line_items: {
        Row: {
          created_at: string
          description: string
          discount_percent: number
          id: string
          invoice_id: string
          line_total: number
          quantity: number
          service_id: string | null
          sort_order: number
          tax_rate: number
          team_id: string | null
          unit_price: number
          user_id: string
        }
        Insert: {
          created_at?: string
          description: string
          discount_percent?: number
          id?: string
          invoice_id: string
          line_total?: number
          quantity?: number
          service_id?: string | null
          sort_order?: number
          tax_rate?: number
          team_id?: string | null
          unit_price?: number
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string
          discount_percent?: number
          id?: string
          invoice_id?: string
          line_total?: number
          quantity?: number
          service_id?: string | null
          sort_order?: number
          tax_rate?: number
          team_id?: string | null
          unit_price?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoice_line_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_line_items_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_line_items_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount_paid: number
          balance_due: number
          client_id: string | null
          client_notes: string | null
          created_at: string
          discount_amount: number
          due_date: string | null
          id: string
          internal_notes: string | null
          invoice_number: string
          is_recurring: boolean
          job_id: string | null
          paid_at: string | null
          payment_terms: string | null
          quote_id: string | null
          recurring_end: string | null
          recurring_frequency:
            | Database["public"]["Enums"]["recurring_frequency"]
            | null
          recurring_start: string | null
          sent_at: string | null
          status: Database["public"]["Enums"]["invoice_status"]
          subtotal: number
          tax_amount: number
          team_id: string | null
          title: string | null
          total: number
          updated_at: string
          user_id: string
          viewed_at: string | null
        }
        Insert: {
          amount_paid?: number
          balance_due?: number
          client_id?: string | null
          client_notes?: string | null
          created_at?: string
          discount_amount?: number
          due_date?: string | null
          id?: string
          internal_notes?: string | null
          invoice_number: string
          is_recurring?: boolean
          job_id?: string | null
          paid_at?: string | null
          payment_terms?: string | null
          quote_id?: string | null
          recurring_end?: string | null
          recurring_frequency?:
            | Database["public"]["Enums"]["recurring_frequency"]
            | null
          recurring_start?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          subtotal?: number
          tax_amount?: number
          team_id?: string | null
          title?: string | null
          total?: number
          updated_at?: string
          user_id: string
          viewed_at?: string | null
        }
        Update: {
          amount_paid?: number
          balance_due?: number
          client_id?: string | null
          client_notes?: string | null
          created_at?: string
          discount_amount?: number
          due_date?: string | null
          id?: string
          internal_notes?: string | null
          invoice_number?: string
          is_recurring?: boolean
          job_id?: string | null
          paid_at?: string | null
          payment_terms?: string | null
          quote_id?: string | null
          recurring_end?: string | null
          recurring_frequency?:
            | Database["public"]["Enums"]["recurring_frequency"]
            | null
          recurring_start?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          subtotal?: number
          tax_amount?: number
          team_id?: string | null
          title?: string | null
          total?: number
          updated_at?: string
          user_id?: string
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          address: string | null
          client_id: string | null
          completed_at: string | null
          created_at: string
          description: string | null
          id: string
          internal_notes: string | null
          job_number: string
          property_id: string | null
          quote_id: string | null
          scheduled_end: string | null
          scheduled_start: string | null
          status: Database["public"]["Enums"]["job_status"]
          team_id: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          client_id?: string | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          id?: string
          internal_notes?: string | null
          job_number: string
          property_id?: string | null
          quote_id?: string | null
          scheduled_end?: string | null
          scheduled_start?: string | null
          status?: Database["public"]["Enums"]["job_status"]
          team_id?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          client_id?: string | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          id?: string
          internal_notes?: string | null
          job_number?: string
          property_id?: string | null
          quote_id?: string | null
          scheduled_end?: string | null
          scheduled_start?: string | null
          status?: Database["public"]["Enums"]["job_status"]
          team_id?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "jobs_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          id: string
          invoice_id: string
          notes: string | null
          payment_date: string
          payment_method: Database["public"]["Enums"]["payment_method"]
          reference_number: string | null
          stripe_payment_id: string | null
          team_id: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          invoice_id: string
          notes?: string | null
          payment_date?: string
          payment_method?: Database["public"]["Enums"]["payment_method"]
          reference_number?: string | null
          stripe_payment_id?: string | null
          team_id?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          invoice_id?: string
          notes?: string | null
          payment_date?: string
          payment_method?: Database["public"]["Enums"]["payment_method"]
          reference_number?: string | null
          stripe_payment_id?: string | null
          team_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      payouts: {
        Row: {
          amount_cents: number
          arrival_date: string | null
          created_at: string
          id: string
          status: string
          stripe_payout_id: string | null
          team_id: string | null
          user_id: string
        }
        Insert: {
          amount_cents: number
          arrival_date?: string | null
          created_at?: string
          id?: string
          status?: string
          stripe_payout_id?: string | null
          team_id?: string | null
          user_id: string
        }
        Update: {
          amount_cents?: number
          arrival_date?: string | null
          created_at?: string
          id?: string
          status?: string
          stripe_payout_id?: string | null
          team_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payouts_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          is_super_admin: boolean
          trial_ends_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          is_super_admin?: boolean
          trial_ends_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          is_super_admin?: boolean
          trial_ends_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      properties: {
        Row: {
          address_line1: string | null
          address_line2: string | null
          city: string | null
          client_id: string
          country: string | null
          created_at: string
          id: string
          name: string
          notes: string | null
          state: string | null
          team_id: string | null
          updated_at: string
          user_id: string
          zip: string | null
        }
        Insert: {
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          client_id: string
          country?: string | null
          created_at?: string
          id?: string
          name?: string
          notes?: string | null
          state?: string | null
          team_id?: string | null
          updated_at?: string
          user_id: string
          zip?: string | null
        }
        Update: {
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          client_id?: string
          country?: string | null
          created_at?: string
          id?: string
          name?: string
          notes?: string | null
          state?: string | null
          team_id?: string | null
          updated_at?: string
          user_id?: string
          zip?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "properties_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "properties_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      quote_line_items: {
        Row: {
          created_at: string
          description: string
          discount_percent: number
          id: string
          line_total: number
          quantity: number
          quote_id: string
          service_id: string | null
          sort_order: number
          tax_rate: number
          team_id: string | null
          unit_price: number
          user_id: string
        }
        Insert: {
          created_at?: string
          description: string
          discount_percent?: number
          id?: string
          line_total?: number
          quantity?: number
          quote_id: string
          service_id?: string | null
          sort_order?: number
          tax_rate?: number
          team_id?: string | null
          unit_price?: number
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string
          discount_percent?: number
          id?: string
          line_total?: number
          quantity?: number
          quote_id?: string
          service_id?: string | null
          sort_order?: number
          tax_rate?: number
          team_id?: string | null
          unit_price?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quote_line_items_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quote_line_items_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quote_line_items_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      quotes: {
        Row: {
          approved_at: string | null
          client_id: string | null
          client_notes: string | null
          created_at: string
          deposit_amount: number | null
          deposit_type: string | null
          deposit_value: number | null
          discount_amount: number
          id: string
          internal_notes: string | null
          property_id: string | null
          quote_number: string
          sent_at: string | null
          status: Database["public"]["Enums"]["quote_status"]
          subtotal: number
          tax_amount: number
          team_id: string | null
          title: string | null
          total: number
          updated_at: string
          user_id: string
          valid_until: string | null
          viewed_at: string | null
        }
        Insert: {
          approved_at?: string | null
          client_id?: string | null
          client_notes?: string | null
          created_at?: string
          deposit_amount?: number | null
          deposit_type?: string | null
          deposit_value?: number | null
          discount_amount?: number
          id?: string
          internal_notes?: string | null
          property_id?: string | null
          quote_number: string
          sent_at?: string | null
          status?: Database["public"]["Enums"]["quote_status"]
          subtotal?: number
          tax_amount?: number
          team_id?: string | null
          title?: string | null
          total?: number
          updated_at?: string
          user_id: string
          valid_until?: string | null
          viewed_at?: string | null
        }
        Update: {
          approved_at?: string | null
          client_id?: string | null
          client_notes?: string | null
          created_at?: string
          deposit_amount?: number | null
          deposit_type?: string | null
          deposit_value?: number | null
          discount_amount?: number
          id?: string
          internal_notes?: string | null
          property_id?: string | null
          quote_number?: string
          sent_at?: string | null
          status?: Database["public"]["Enums"]["quote_status"]
          subtotal?: number
          tax_amount?: number
          team_id?: string | null
          title?: string | null
          total?: number
          updated_at?: string
          user_id?: string
          valid_until?: string | null
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quotes_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      review_requests: {
        Row: {
          client_id: string
          created_at: string
          expires_at: string
          feedback: string | null
          id: string
          job_id: string | null
          owner_notified_at: string | null
          posted_to_google_confirmed_at: string | null
          rating: number | null
          redirected_to_google: boolean
          reminder_sent_at: string | null
          status: string
          submitted_at: string | null
          team_id: string | null
          token: string
          user_id: string
        }
        Insert: {
          client_id: string
          created_at?: string
          expires_at?: string
          feedback?: string | null
          id?: string
          job_id?: string | null
          owner_notified_at?: string | null
          posted_to_google_confirmed_at?: string | null
          rating?: number | null
          redirected_to_google?: boolean
          reminder_sent_at?: string | null
          status?: string
          submitted_at?: string | null
          team_id?: string | null
          token?: string
          user_id: string
        }
        Update: {
          client_id?: string
          created_at?: string
          expires_at?: string
          feedback?: string | null
          id?: string
          job_id?: string | null
          owner_notified_at?: string | null
          posted_to_google_confirmed_at?: string | null
          rating?: number | null
          redirected_to_google?: boolean
          reminder_sent_at?: string | null
          status?: string
          submitted_at?: string | null
          team_id?: string | null
          token?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_requests_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_requests_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_requests_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      services_catalog: {
        Row: {
          category: string | null
          created_at: string
          default_price: number
          description: string | null
          id: string
          is_active: boolean
          name: string
          tax_rate: number | null
          team_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          default_price?: number
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          tax_rate?: number | null
          team_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string
          default_price?: number
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          tax_rate?: number | null
          team_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "services_catalog_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
      team_invitations: {
        Row: {
          accepted_at: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string
          role: Database["public"]["Enums"]["app_role"]
          team_id: string
          token: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by: string
          role?: Database["public"]["Enums"]["app_role"]
          team_id: string
          token?: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          role?: Database["public"]["Enums"]["app_role"]
          team_id?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_invitations_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          team_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          team_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          team_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_team_members_profile"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          created_at: string
          id: string
          name: string
          owner_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          owner_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          owner_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      webhook_errors: {
        Row: {
          created_at: string
          error_message: string | null
          event_type: string | null
          id: string
          raw_payload: Json | null
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          event_type?: string | null
          id?: string
          raw_payload?: Json | null
        }
        Update: {
          created_at?: string
          error_message?: string | null
          event_type?: string | null
          id?: string
          raw_payload?: Json | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_team_invitation: {
        Args: { _token: string; _user_id: string }
        Returns: Json
      }
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      get_user_team_id: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      has_team_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _team_id: string
          _user_id: string
        }
        Returns: boolean
      }
      is_team_member: {
        Args: { _team_id: string; _user_id: string }
        Returns: boolean
      }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "manager" | "user"
      client_status: "lead" | "active" | "archived"
      invoice_status: "draft" | "sent" | "viewed" | "paid" | "overdue"
      job_status:
        | "pending"
        | "in_progress"
        | "complete"
        | "invoiced"
        | "on_hold"
      payment_method:
        | "cash"
        | "check"
        | "credit_card"
        | "ach"
        | "stripe"
        | "other"
      quote_status: "draft" | "sent" | "approved" | "converted" | "expired"
      recurring_frequency:
        | "weekly"
        | "biweekly"
        | "monthly"
        | "quarterly"
        | "yearly"
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
    Enums: {
      app_role: ["admin", "manager", "user"],
      client_status: ["lead", "active", "archived"],
      invoice_status: ["draft", "sent", "viewed", "paid", "overdue"],
      job_status: ["pending", "in_progress", "complete", "invoiced", "on_hold"],
      payment_method: [
        "cash",
        "check",
        "credit_card",
        "ach",
        "stripe",
        "other",
      ],
      quote_status: ["draft", "sent", "approved", "converted", "expired"],
      recurring_frequency: [
        "weekly",
        "biweekly",
        "monthly",
        "quarterly",
        "yearly",
      ],
    },
  },
} as const
