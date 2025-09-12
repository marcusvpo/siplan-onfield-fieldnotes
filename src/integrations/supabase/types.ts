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
      anexos: {
        Row: {
          autor_id: string
          created_at: string
          data: string
          descricao: string | null
          id: string
          projeto_id: string
          tipo: Database["public"]["Enums"]["anexo_type"]
          updated_at: string
          url_arquivo: string
        }
        Insert: {
          autor_id: string
          created_at?: string
          data?: string
          descricao?: string | null
          id?: string
          projeto_id: string
          tipo: Database["public"]["Enums"]["anexo_type"]
          updated_at?: string
          url_arquivo: string
        }
        Update: {
          autor_id?: string
          created_at?: string
          data?: string
          descricao?: string | null
          id?: string
          projeto_id?: string
          tipo?: Database["public"]["Enums"]["anexo_type"]
          updated_at?: string
          url_arquivo?: string
        }
        Relationships: [
          {
            foreignKeyName: "anexos_autor_id_fkey"
            columns: ["autor_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "anexos_projeto_id_fkey"
            columns: ["projeto_id"]
            isOneToOne: false
            referencedRelation: "projetos"
            referencedColumns: ["id"]
          },
        ]
      }
      atividades_recentes: {
        Row: {
          acao: string
          created_at: string
          descricao: string | null
          id: string
          projeto_id: string | null
          usuario_id: string | null
        }
        Insert: {
          acao: string
          created_at?: string
          descricao?: string | null
          id?: string
          projeto_id?: string | null
          usuario_id?: string | null
        }
        Update: {
          acao?: string
          created_at?: string
          descricao?: string | null
          id?: string
          projeto_id?: string | null
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "atividades_recentes_projeto_id_fkey"
            columns: ["projeto_id"]
            isOneToOne: false
            referencedRelation: "projetos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "atividades_recentes_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      auditoria: {
        Row: {
          acao: string
          data: string
          detalhes: Json | null
          id: string
          projeto_id: string | null
          usuario_id: string
        }
        Insert: {
          acao: string
          data?: string
          detalhes?: Json | null
          id?: string
          projeto_id?: string | null
          usuario_id: string
        }
        Update: {
          acao?: string
          data?: string
          detalhes?: Json | null
          id?: string
          projeto_id?: string | null
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "auditoria_projeto_id_fkey"
            columns: ["projeto_id"]
            isOneToOne: false
            referencedRelation: "projetos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "auditoria_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      blocos: {
        Row: {
          autor_id: string
          created_at: string
          data: string
          dia: string
          hash_arquivo: string | null
          id: string
          projeto_id: string
          texto: string | null
          tipo: Database["public"]["Enums"]["bloco_type"]
          transcricao: string | null
          updated_at: string
          url_arquivo: string | null
          versao: number
        }
        Insert: {
          autor_id: string
          created_at?: string
          data?: string
          dia?: string
          hash_arquivo?: string | null
          id?: string
          projeto_id: string
          texto?: string | null
          tipo: Database["public"]["Enums"]["bloco_type"]
          transcricao?: string | null
          updated_at?: string
          url_arquivo?: string | null
          versao?: number
        }
        Update: {
          autor_id?: string
          created_at?: string
          data?: string
          dia?: string
          hash_arquivo?: string | null
          id?: string
          projeto_id?: string
          texto?: string | null
          tipo?: Database["public"]["Enums"]["bloco_type"]
          transcricao?: string | null
          updated_at?: string
          url_arquivo?: string | null
          versao?: number
        }
        Relationships: [
          {
            foreignKeyName: "blocos_autor_id_fkey"
            columns: ["autor_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blocos_projeto_id_fkey"
            columns: ["projeto_id"]
            isOneToOne: false
            referencedRelation: "projetos"
            referencedColumns: ["id"]
          },
        ]
      }
      chamados: {
        Row: {
          Caminho: string | null
          Chamado: string | null
          "Cliente - Cliente - Nome Fantasia": string | null
          "Data de abertura": string | null
          Descricao: string | null
          id: number
          Modulo: string | null
          Natureza: string | null
          Prioridade: string | null
          Severidade: string | null
          Status: string | null
          Titulo: string | null
        }
        Insert: {
          Caminho?: string | null
          Chamado?: string | null
          "Cliente - Cliente - Nome Fantasia"?: string | null
          "Data de abertura"?: string | null
          Descricao?: string | null
          id?: number
          Modulo?: string | null
          Natureza?: string | null
          Prioridade?: string | null
          Severidade?: string | null
          Status?: string | null
          Titulo?: string | null
        }
        Update: {
          Caminho?: string | null
          Chamado?: string | null
          "Cliente - Cliente - Nome Fantasia"?: string | null
          "Data de abertura"?: string | null
          Descricao?: string | null
          id?: number
          Modulo?: string | null
          Natureza?: string | null
          Prioridade?: string | null
          Severidade?: string | null
          Status?: string | null
          Titulo?: string | null
        }
        Relationships: []
      }
      comentarios_projeto: {
        Row: {
          audio_url: string | null
          created_at: string
          id: string
          projeto_id: string
          texto: string
          type: string
          updated_at: string
          usuario_id: string | null
        }
        Insert: {
          audio_url?: string | null
          created_at?: string
          id?: string
          projeto_id: string
          texto: string
          type?: string
          updated_at?: string
          usuario_id?: string | null
        }
        Update: {
          audio_url?: string | null
          created_at?: string
          id?: string
          projeto_id?: string
          texto?: string
          type?: string
          updated_at?: string
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_comentarios_usuario_auth_id"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["auth_id"]
          },
        ]
      }
      projetos: {
        Row: {
          chamado: string
          created_at: string
          data_fim_implantacao: string
          data_inicio_implantacao: string
          email_contato: string
          estado: string
          id: string
          nome_cartorio: string
          observacao_admin: string | null
          sistema: string[]
          status: Database["public"]["Enums"]["project_status"]
          telefone_contato: string | null
          updated_at: string
          usuario_id: string | null
        }
        Insert: {
          chamado: string
          created_at?: string
          data_fim_implantacao: string
          data_inicio_implantacao: string
          email_contato: string
          estado: string
          id?: string
          nome_cartorio: string
          observacao_admin?: string | null
          sistema: string[]
          status?: Database["public"]["Enums"]["project_status"]
          telefone_contato?: string | null
          updated_at?: string
          usuario_id?: string | null
        }
        Update: {
          chamado?: string
          created_at?: string
          data_fim_implantacao?: string
          data_inicio_implantacao?: string
          email_contato?: string
          estado?: string
          id?: string
          nome_cartorio?: string
          observacao_admin?: string | null
          sistema?: string[]
          status?: Database["public"]["Enums"]["project_status"]
          telefone_contato?: string | null
          updated_at?: string
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projetos_usuario_id_users_auth_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["auth_id"]
          },
        ]
      }
      relatorios: {
        Row: {
          created_at: string
          created_by: string
          data_geracao: string
          id: string
          projeto_id: string
          status: Database["public"]["Enums"]["relatorio_status"]
          texto: string | null
          updated_at: string
          url_docx: string | null
          url_pdf: string | null
          url_txt: string | null
          versao: number
        }
        Insert: {
          created_at?: string
          created_by: string
          data_geracao?: string
          id?: string
          projeto_id: string
          status?: Database["public"]["Enums"]["relatorio_status"]
          texto?: string | null
          updated_at?: string
          url_docx?: string | null
          url_pdf?: string | null
          url_txt?: string | null
          versao?: number
        }
        Update: {
          created_at?: string
          created_by?: string
          data_geracao?: string
          id?: string
          projeto_id?: string
          status?: Database["public"]["Enums"]["relatorio_status"]
          texto?: string | null
          updated_at?: string
          url_docx?: string | null
          url_pdf?: string | null
          url_txt?: string | null
          versao?: number
        }
        Relationships: [
          {
            foreignKeyName: "relatorios_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "relatorios_projeto_id_fkey"
            columns: ["projeto_id"]
            isOneToOne: false
            referencedRelation: "projetos"
            referencedColumns: ["id"]
          },
        ]
      }
      sistemas: {
        Row: {
          ativo: boolean
          created_at: string
          id: string
          nome: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          id?: string
          nome: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          id?: string
          nome?: string
          updated_at?: string
        }
        Relationships: []
      }
      status_projeto: {
        Row: {
          ativo: boolean
          cor: string
          created_at: string
          id: string
          nome: string
          ordem: number
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          cor: string
          created_at?: string
          id?: string
          nome: string
          ordem: number
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          cor?: string
          created_at?: string
          id?: string
          nome?: string
          ordem?: number
          updated_at?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          ativo: boolean
          auth_id: string | null
          created_at: string
          email: string
          id: string
          nome: string
          tipo: Database["public"]["Enums"]["user_type"]
          updated_at: string
          username: string | null
        }
        Insert: {
          ativo?: boolean
          auth_id?: string | null
          created_at?: string
          email: string
          id?: string
          nome: string
          tipo?: Database["public"]["Enums"]["user_type"]
          updated_at?: string
          username?: string | null
        }
        Update: {
          ativo?: boolean
          auth_id?: string | null
          created_at?: string
          email?: string
          id?: string
          nome?: string
          tipo?: Database["public"]["Enums"]["user_type"]
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
      users_safe_lookup: {
        Row: {
          ativo: boolean
          auth_id: string | null
          created_at: string | null
          email: string | null
          id: string
          nome: string
          tipo: Database["public"]["Enums"]["user_type"]
          updated_at: string | null
          user_id: string
          username: string | null
        }
        Insert: {
          ativo?: boolean
          auth_id?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          nome: string
          tipo: Database["public"]["Enums"]["user_type"]
          updated_at?: string | null
          user_id: string
          username?: string | null
        }
        Update: {
          ativo?: boolean
          auth_id?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          nome?: string
          tipo?: Database["public"]["Enums"]["user_type"]
          updated_at?: string | null
          user_id?: string
          username?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "users_safe_lookup_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      authenticate_implantador: {
        Args: { p_password: string; p_username: string }
        Returns: {
          email: string
          id: string
          user_metadata: Json
        }[]
      }
      get_current_user_type: {
        Args: Record<PropertyKey, never>
        Returns: Database["public"]["Enums"]["user_type"]
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      log_audit: {
        Args: { p_acao: string; p_detalhes?: Json; p_projeto_id: string }
        Returns: string
      }
      user_owns_project: {
        Args: { p_project_id: string }
        Returns: boolean
      }
      user_owns_project_from_path: {
        Args: { file_path: string }
        Returns: boolean
      }
    }
    Enums: {
      anexo_type: "imagem" | "pdf" | "outro"
      bloco_type: "audio" | "texto"
      project_status: "aguardando" | "em_andamento" | "finalizado" | "cancelado"
      relatorio_status: "gerado" | "revisado"
      sistema_type: "Orion PRO" | "Orion REG" | "Orion TN" | "WebRI"
      user_type: "admin" | "implantador"
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
      anexo_type: ["imagem", "pdf", "outro"],
      bloco_type: ["audio", "texto"],
      project_status: ["aguardando", "em_andamento", "finalizado", "cancelado"],
      relatorio_status: ["gerado", "revisado"],
      sistema_type: ["Orion PRO", "Orion REG", "Orion TN", "WebRI"],
      user_type: ["admin", "implantador"],
    },
  },
} as const
