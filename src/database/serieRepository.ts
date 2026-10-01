import type { CreateSerieInput, Serie, SerieFilter, UpdateSerieInput } from '../types/serie';
import { getDatabase } from './database';

/** Mais recente primeiro; `id` desempata séries criadas no mesmo instante. */
export async function getSeries(filtro: SerieFilter): Promise<Serie[]> {
  const db = await getDatabase();

  if (filtro === 'todas') {
    return db.getAllAsync<Serie>(
      'SELECT * FROM series ORDER BY createdAt DESC, id DESC',
    );
  }

  const concluida = filtro === 'concluidas' ? 1 : 0;
  return db.getAllAsync<Serie>(
    'SELECT * FROM series WHERE concluida = ? ORDER BY createdAt DESC, id DESC',
    [concluida],
  );
}

export async function getSerieById(id: number): Promise<Serie | null> {
  const db = await getDatabase();
  return db.getFirstAsync<Serie>('SELECT * FROM series WHERE id = ?', [id]);
}

export async function createSerie(input: CreateSerieInput): Promise<Serie> {
  const db = await getDatabase();
  const createdAt = new Date().toISOString();
  const concluida = 0;

  const result = await db.runAsync(
    `INSERT INTO series (titulo, plataforma, temporadas, nota, concluida, createdAt)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [input.titulo, input.plataforma, input.temporadas, input.nota, concluida, createdAt],
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
     SET titulo = ?, plataforma = ?, temporadas = ?, nota = ?
     WHERE id = ?`,
    [input.titulo, input.plataforma, input.temporadas, input.nota, id],
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
