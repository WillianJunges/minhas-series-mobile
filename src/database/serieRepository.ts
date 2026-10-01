import type {
  CreateSerieInput,
  Serie,
  SerieContagem,
  SerieFilter,
  SerieOrdem,
  UpdateSerieInput,
} from '../types/serie';
import { montarTextoBusca, semAcento } from '../utils/texto';
import { getDatabase } from './database';

/**
 * Lista as séries aplicando, tudo no SQL:
 * - filtro: 'todas' ignora o status; os outros comparam `concluida` com 0 ou 1;
 * - plataforma: null mostra todas; senão só a escolhida (sem diferenciar maiúsculas);
 * - busca: parte do título OU da plataforma, ignorando acentos e maiúsculas;
 * - ordem: 'recentes', 'nota' (maior primeiro, sem nota no fim) ou 'alfabetica' (A-Z).
 *
 * As colunas são listadas uma a uma (e não com *) para não trazer a coluna
 * interna `textoBusca`, que não faz parte do tipo `Serie`.
 */
export async function getSeries(
  filtro: SerieFilter,
  busca: string = '',
  ordem: SerieOrdem = 'recentes',
  plataforma: string | null = null,
): Promise<Serie[]> {
  const db = await getDatabase();
  const concluida = filtro === 'concluidas' ? 1 : 0;
  // O % entra no VALOR: "%off%" acha "The Office". A query continua só com "?".
  // A busca também é "limpa" (sem acento), igual à coluna textoBusca.
  const termo = '%' + semAcento(busca.trim()) + '%';

  return db.getAllAsync<Serie>(
    `SELECT id, titulo, plataforma, temporadas, nota, concluida, createdAt
     FROM series
     WHERE (? = 'todas' OR concluida = ?)
       AND (? IS NULL OR plataforma = ? COLLATE NOCASE)
       AND textoBusca LIKE ?
     ORDER BY
       CASE WHEN ? = 'nota' THEN COALESCE(nota, 0) END DESC,
       CASE WHEN ? = 'alfabetica' THEN textoBusca END ASC,
       createdAt DESC,
       id DESC`,
    [filtro, concluida, plataforma, plataforma, termo, ordem, ordem],
  );
}

/** Plataformas já cadastradas, sem repetir ("Netflix" e "netflix" contam como uma) e em ordem A-Z. */
export async function getPlataformas(): Promise<string[]> {
  const db = await getDatabase();
  const linhas = await db.getAllAsync<{ plataforma: string }>(
    `SELECT MIN(plataforma) AS plataforma
     FROM series
     GROUP BY plataforma COLLATE NOCASE
     ORDER BY plataforma COLLATE NOCASE`,
  );
  return linhas.map((linha) => linha.plataforma);
}

/** Total de séries e quantas estão concluídas, contado pelo próprio banco. */
export async function getContagem(): Promise<SerieContagem> {
  const db = await getDatabase();
  const resultado = await db.getFirstAsync<SerieContagem>(
    `SELECT
       COUNT(*) AS total,
       COUNT(CASE WHEN concluida = 1 THEN 1 END) AS concluidas
     FROM series`,
  );
  return resultado ?? { total: 0, concluidas: 0 };
}

export async function getSerieById(id: number): Promise<Serie | null> {
  const db = await getDatabase();
  return db.getFirstAsync<Serie>(
    `SELECT id, titulo, plataforma, temporadas, nota, concluida, createdAt
     FROM series
     WHERE id = ?`,
    [id],
  );
}

export async function createSerie(input: CreateSerieInput): Promise<Serie> {
  const db = await getDatabase();
  const createdAt = new Date().toISOString();
  const concluida = 0;

  const result = await db.runAsync(
    `INSERT INTO series (titulo, plataforma, temporadas, nota, concluida, createdAt, textoBusca)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      input.titulo,
      input.plataforma,
      input.temporadas,
      input.nota,
      concluida,
      createdAt,
      montarTextoBusca(input.titulo, input.plataforma),
    ],
  );

  return {
    id: result.lastInsertRowId,
    titulo: input.titulo,
    plataforma: input.plataforma,
    temporadas: input.temporadas,
    nota: input.nota,
    concluida,
    createdAt,
  };
}

export async function updateSerie(id: number, input: UpdateSerieInput): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `UPDATE series
     SET titulo = ?, plataforma = ?, temporadas = ?, nota = ?, textoBusca = ?
     WHERE id = ?`,
    [
      input.titulo,
      input.plataforma,
      input.temporadas,
      input.nota,
      montarTextoBusca(input.titulo, input.plataforma),
      id,
    ],
  );
}

/** Inverte o status direto no SQL (0 ↔ 1), sem precisar ler a série antes. */
export async function toggleSerieConcluida(id: number): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('UPDATE series SET concluida = 1 - concluida WHERE id = ?', [id]);
}

export async function deleteSerie(id: number): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM series WHERE id = ?', [id]);
}
