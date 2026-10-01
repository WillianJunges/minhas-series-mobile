const SEM_ACENTO: Record<string, string> = {
  á: 'a', à: 'a', â: 'a', ã: 'a', ä: 'a',
  é: 'e', è: 'e', ê: 'e', ë: 'e',
  í: 'i', ì: 'i', î: 'i', ï: 'i',
  ó: 'o', ò: 'o', ô: 'o', õ: 'o', ö: 'o',
  ú: 'u', ù: 'u', û: 'u', ü: 'u',
  ç: 'c', ñ: 'n',
};

/**
 * Deixa o texto em minúsculas e sem acento: "Série Ótima" -> "serie otima".
 * O SQLite não sabe ignorar acento, então a comparação é feita com textos já "limpos".
 */
export function semAcento(texto: string): string {
  return texto.toLowerCase().replace(/[áàâãäéèêëíìîïóòôõöúùûüçñ]/g, (letra) => SEM_ACENTO[letra]);
}

/** Texto guardado na coluna `textoBusca`: título + plataforma, sem acento e em minúsculas. */
export function montarTextoBusca(titulo: string, plataforma: string): string {
  return semAcento(titulo + ' ' + plataforma);
}
