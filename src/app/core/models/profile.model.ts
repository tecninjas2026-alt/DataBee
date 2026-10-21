/** IMP-032 — contrato da migration proposta; ainda não aplicado no projeto remoto. */
export interface Profile {
  /** Mesmo identificador da conta em Auth; não expõe o e-mail. */
  id: string;
  display_name: string;
  /** Data de criação do perfil, gerada pelo banco. */
  created_at: string;
}

/** Recuperação de perfil ausente: somente o próprio id; created_at vem do banco. */
export interface ProfileInsert {
  id: string;
  display_name: string;
}

/** O cliente só pode alterar o próprio apelido; id e created_at são protegidos. */
export interface ProfileOwnerUpdate {
  display_name: string;
}
