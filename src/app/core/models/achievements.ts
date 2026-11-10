/** D23 — exatamente três conquistas educativas no MVP. Sem ranking nem prêmio por volume. */
export type AchievementId = 'primeiro_voo' | 'olhar_atento' | 'aprendiz';

export const ATTENTIVE_EYE_TARGET = 3;

export interface ObservationPhotoReviewInsert {
  observation_id: string;
  photo_sha256: string;
}

export interface AchievementDefinition {
  id: AchievementId;
  emoji: string;
  title: string;
  rule: string;
}

export const ACHIEVEMENTS: readonly AchievementDefinition[] = [
  { id: 'primeiro_voo', emoji: '🌱', title: 'Primeiro Voo', rule: 'Complete seu primeiro registro.' },
  { id: 'olhar_atento', emoji: '📷', title: 'Olhar Atento', rule: 'Confira 3 fotos diferentes nas suas observações.' },
  { id: 'aprendiz', emoji: '📚', title: 'Aprendiz', rule: 'Conclua um conteúdo educativo do DataBee.' },
];
