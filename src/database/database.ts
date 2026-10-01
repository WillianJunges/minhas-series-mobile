import * as SQLite from 'expo-sqlite';

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
}
