export type UserRole = "broker" | "installer" | "admin";

export type QuoteStatus = "draft" | "pending" | "approved" | "rejected" | "closed";

export type ProjectStage = "design" | "equipment" | "installation" | "delivered";

export type SystemType = "onGrid" | "offGrid" | "hybrid";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string;
          role: UserRole;
          phone: string | null;
          city: string | null;
          company_name: string | null;
          trade_name: string | null;
          logo_url: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["profiles"]["Row"], "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
      };
      quotes: {
        Row: {
          id: string;
          broker_id: string;
          client_name: string;
          client_email: string | null;
          client_phone: string | null;
          city: string;
          property_address: string | null;
          system_type: string;
          monthly_consumption_kwh: number;
          monthly_bill_cop: number;
          num_panels: number;
          kwp: number;
          roof_type: "plana" | "inclinada" | "carport";
          project_value_cop: number;
          commission_month1: number;
          commission_month2: number;
          commission_month3: number;
          status: QuoteStatus;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["quotes"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["quotes"]["Insert"]>;
      };
      quote_items: {
        Row: {
          id: string;
          quote_id: string;
          catalog_item_id: string | null;
          name: string;
          description: string;
          category: string;
          quantity: number;
          unit_price_cop: number;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["quote_items"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["quote_items"]["Insert"]>;
      };
      projects: {
        Row: {
          id: string;
          quote_id: string | null;
          installer_id: string;
          broker_id: string | null;
          client_name: string;
          city: string;
          kwp: number;
          stage: ProjectStage;
          start_date: string | null;
          end_date: string | null;
          total_value_cop: number;
          installer_payment_cop: number;
          installer_paid: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["projects"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["projects"]["Insert"]>;
      };
      commissions: {
        Row: {
          id: string;
          broker_id: string;
          project_id: string;
          month_number: number;
          amount_cop: number;
          paid: boolean;
          paid_at: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["commissions"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["commissions"]["Insert"]>;
      };
      equipment_catalog: {
        Row: {
          id: string;
          name: string;
          spec: string;
          unit: string;
          public_price_cop: number;
          partner_price_cop: number;
          stock: number;
          active: boolean;
          category: string;
          wattage_wp: number | null;
        };
        Insert: Omit<Database["public"]["Tables"]["equipment_catalog"]["Row"], "id">;
        Update: Partial<Database["public"]["Tables"]["equipment_catalog"]["Insert"]>;
      };
    };
  };
}
