/** Entidade completa, exatamente como está na tabela `series` do SQLite. */
export type Serie = {
  id: number;
  titulo: string;
  plataforma: string;
  /** Quantas temporadas a pessoa já assistiu. */
  temporadas: number;
  /** De 1 a 5, ou `null` quando ainda não foi avaliada. */
  nota: number | null;
  /** 0 = assistindo, 1 = concluída (SQLite não tem booleano). */
  concluida: number;
  /** ISO 8601, gerado no repositório. */
  createdAt: string;
};

/** Dados informados no cadastro. `id` e `createdAt` são gerados; toda série nova começa como "assistindo". */
export type CreateSerieInput = Omit<Serie, 'id' | 'createdAt' | 'concluida'>;

/** Campos editáveis no formulário. */
export type UpdateSerieInput = Pick<Serie, 'titulo' | 'plataforma' | 'temporadas' | 'nota'>;

export type SerieFilter = 'todas' | 'assistindo' | 'concluidas';

/** Ordenação da lista: mais recentes, maior nota ou ordem alfabética (A-Z). */
export type SerieOrdem = 'recentes' | 'nota' | 'alfabetica';

/** Totais mostrados no contador do topo da lista. */
export type SerieContagem = {
  total: number;
  concluidas: number;
};
