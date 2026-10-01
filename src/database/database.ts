import * as SQLite from 'expo-sqlite';
import { montarTextoBusca } from '../utils/texto';

const DATABASE_NAME = 'minhas-series.db';

/**
 * Singleton da conexão. Guardamos a Promise (e não o banco já aberto) para que
 * chamadas simultâneas a `getDatabase()` reaproveitem a mesma abertura em vez
 * de abrir várias conexões.
 */
let databasePromise: Promise<SQLite.SQLiteDatabase> | null = null;

export function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!databasePromise) {
    databasePromise = SQLite.openDatabaseAsync(DATABASE_NAME).catch((error) => {
      // Se a abertura falhar, permite tentar de novo na próxima chamada.
      databasePromise = null;
      throw error;
    });
  }
  return databasePromise;
}

/** Cria a estrutura do banco. Seguro para rodar a cada inicialização do app. */
export async function runMigrations(): Promise<void> {
  const db = await getDatabase();

  await db.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS series (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      titulo     TEXT    NOT NULL,
      plataforma TEXT    NOT NULL,
      temporadas INTEGER NOT NULL,
      nota       INTEGER CHECK (nota IS NULL OR nota BETWEEN 1 AND 5),
      concluida  INTEGER NOT NULL DEFAULT 0 CHECK (concluida IN (0, 1)),
      createdAt  TEXT    NOT NULL
    );
  `);

  // Migração 2: coluna de busca sem acento (título + plataforma).
  // O CREATE TABLE IF NOT EXISTS não altera uma tabela que já existe,
  // então a coluna é adicionada com ALTER TABLE, só se ainda não existir.
  const colunas = await db.getAllAsync<{ name: string }>('PRAGMA table_info(series)');
  if (!colunas.some((coluna) => coluna.name === 'textoBusca')) {
    await db.execAsync("ALTER TABLE series ADD COLUMN textoBusca TEXT NOT NULL DEFAULT ''");
  }

  // Preenche a coluna nas séries que já existiam antes dela.
  const pendentes = await db.getAllAsync<{ id: number; titulo: string; plataforma: string }>(
    "SELECT id, titulo, plataforma FROM series WHERE textoBusca = ''",
  );
  for (const serie of pendentes) {
    await db.runAsync('UPDATE series SET textoBusca = ? WHERE id = ?', [
      montarTextoBusca(serie.titulo, serie.plataforma),
      serie.id,
    ]);
  }
}
