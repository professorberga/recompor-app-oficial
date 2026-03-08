
/**
 * Utilitário para determinar o bimestre com base nas datas oficiais de 2026.
 */
export function getBimestreFromDate(date: Date): string {
  const month = date.getMonth() + 1; // 1-12
  const day = date.getDate();

  // Calendário Letivo 2026 (Estimativa baseada em SP)
  // 1º Bimestre: Fevereiro a Abril
  if (month >= 2 && month <= 4) return "1";
  
  // 2º Bimestre: Maio a Julho (até dia 15)
  if (month >= 5 && month <= 7) {
    if (month === 7 && day > 15) return "3"; // Recesso julho
    return "2";
  }
  
  // 3º Bimestre: Agosto a Setembro
  if (month >= 8 && month <= 9) return "3";
  
  // 4º Bimestre: Outubro a Dezembro
  if (month >= 10 && month <= 12) return "4";
  
  // Janeiro ou datas fora do padrão: Retorna 1 por segurança
  return "1";
}

export const BIMESTRE_LABELS: Record<string, string> = {
  "1": "1º Bimestre",
  "2": "2º Bimestre",
  "3": "3º Bimestre",
  "4": "4º Bimestre",
};
