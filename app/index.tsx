import { useCallback, useState } from 'react';
import { FlatList, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getContagem, getPlataformas, getSeries } from '../src/database/serieRepository';
import type { Serie, SerieContagem, SerieFilter, SerieOrdem } from '../src/types/serie';

const FILTROS: { valor: SerieFilter; rotulo: string }[] = [
  { valor: 'todas', rotulo: 'Todas' },
  { valor: 'assistindo', rotulo: 'Assistindo' },
  { valor: 'concluidas', rotulo: 'Concluídas' },
];

// Cada toque no botão de ordem passa para a próxima: recentes -> nota -> A-Z -> recentes...
const ORDENS: { valor: SerieOrdem; rotulo: string }[] = [
  { valor: 'recentes', rotulo: '🕒 Mais recentes' },
  { valor: 'nota', rotulo: '★ Maior nota' },
  { valor: 'alfabetica', rotulo: '🔤 A-Z' },
];

export default function Home() {
  const [filtro, setFiltro] = useState<SerieFilter>('todas');
  const [busca, setBusca] = useState('');
  const [ordem, setOrdem] = useState<SerieOrdem>('recentes');
  // null = todas as plataformas.
  const [plataforma, setPlataforma] = useState<string | null>(null);
  const [plataformas, setPlataformas] = useState<string[]>([]);
  const [series, setSeries] = useState<Serie[]>([]);
  const [contagem, setContagem] = useState<SerieContagem>({ total: 0, concluidas: 0 });
  // Altura da barra de navegação do Android (voltar/home/recentes), que varia por aparelho.
  const insets = useSafeAreaInsets();

  // Recarrega ao focar a tela (ex.: voltando do /form) e quando filtro, busca, ordem ou plataforma mudam.
  useFocusEffect(
    useCallback(() => {
      getSeries(filtro, busca, ordem, plataforma).then(setSeries);
      getContagem().then(setContagem);
      getPlataformas().then((lista) => {
        setPlataformas(lista);
        // Se a plataforma escolhida sumiu (ex.: excluí a última série dela), volta para "todas".
        if (plataforma !== null && !lista.some((p) => p.toLowerCase() === plataforma.toLowerCase())) {
          setPlataforma(null);
        }
      });
    }, [filtro, busca, ordem, plataforma]),
  );

  const ordemAtual = ORDENS.find((o) => o.valor === ordem) ?? ORDENS[0];
  const proximaOrdem = ORDENS[(ORDENS.indexOf(ordemAtual) + 1) % ORDENS.length].valor;

  return (
    <View className="flex-1 bg-black px-4 pt-4">
      {/* Contador (sempre o total geral, sem filtro) + botão que alterna a ordenação */}
      <View className="mb-3 flex-row items-center justify-between">
        <Text className="text-neutral-400">
          {contagem.total} {contagem.total === 1 ? 'série' : 'séries'} ·{' '}
          {contagem.concluidas} {contagem.concluidas === 1 ? 'concluída' : 'concluídas'}
        </Text>
        <Pressable
          onPress={() => setOrdem(proximaOrdem)}
          className="rounded-full border border-neutral-700 px-3 py-1 active:bg-neutral-800"
        >
          <Text className="text-sm font-semibold text-neutral-300">
            {ordemAtual.rotulo}
          </Text>
        </Pressable>
      </View>

      <View className="mb-3 flex-row items-center rounded-lg bg-neutral-900 px-3">
        <Text className="text-neutral-500">🔍</Text>
        <TextInput
          value={busca}
          onChangeText={setBusca}
          placeholder="Buscar por título ou plataforma..."
          placeholderTextColor="#737373"
          className="flex-1 px-2 py-3 text-white"
        />
        {busca !== '' && (
          <Pressable onPress={() => setBusca('')} hitSlop={10}>
            <Text className="text-lg text-neutral-500">✕</Text>
          </Pressable>
        )}
      </View>

      <View className="mb-4 flex-row gap-2">
        {FILTROS.map((f) => {
          const ativo = f.valor === filtro;
          return (
            <Pressable
              key={f.valor}
              onPress={() => setFiltro(f.valor)}
              className={`rounded-full border px-4 py-2 ${
                ativo ? 'border-red-600 bg-red-600' : 'border-neutral-700 bg-neutral-900'
              }`}
            >
              <Text className={`font-semibold ${ativo ? 'text-white' : 'text-neutral-400'}`}>
                {f.rotulo}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Filtro por plataforma: só aparece quando há mais de uma cadastrada */}
      {plataformas.length > 1 && (
        <View className="mb-4">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2">
            {[null, ...plataformas].map((p) => {
              const ativa = p === null ? plataforma === null : p.toLowerCase() === plataforma?.toLowerCase();
              return (
                <Pressable
                  key={p ?? 'todas'}
                  onPress={() => setPlataforma(p)}
                  className={`rounded-md border px-3 py-1 ${
                    ativa ? 'border-red-600 bg-red-600/20' : 'border-neutral-800'
                  }`}
                >
                  <Text className={`text-sm ${ativa ? 'font-semibold text-red-500' : 'text-neutral-400'}`}>
                    {p ?? 'Todas as plataformas'}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      )}

      <FlatList
        data={series}
        keyExtractor={(item) => String(item.id)}
        contentContainerClassName="gap-3"
        contentContainerStyle={{ paddingBottom: insets.bottom + 96 }}
        ListEmptyComponent={
          <Text className="mt-16 text-center text-neutral-500">
            {busca.trim() !== ''
              ? `Nenhuma série com "${busca.trim()}".`
              : 'Nenhuma série encontrada.'}
          </Text>
        }
        renderItem={({ item }) => {
          const concluida = item.concluida === 1;
          return (
            <Pressable
              onPress={() => router.push(`/detalhe?id=${item.id}`)}
              className={`rounded-lg border-l-4 bg-neutral-900 p-4 ${
                concluida ? 'border-neutral-600 opacity-60' : 'border-red-600'
              }`}
            >
              <View className="flex-row items-center justify-between">
                <Text className="flex-1 text-lg font-bold text-white">{item.titulo}</Text>
                {concluida && (
                  <Text className="text-xs font-semibold text-green-500">✓ Concluída</Text>
                )}
              </View>
              <Text className="mt-1 text-neutral-400">
                {item.plataforma} · {item.temporadas}{' '}
                {item.temporadas === 1 ? 'temporada' : 'temporadas'}
              </Text>
              <Text className="mt-2 text-yellow-400">
                {item.nota === null ? (
                  <Text className="text-neutral-500">Sem nota</Text>
                ) : (
                  '★'.repeat(item.nota)
                )}
              </Text>
            </Pressable>
          );
        }}
      />

      <Pressable
        onPress={() => router.push('/form')}
        style={{ bottom: insets.bottom + 16 }}
        className="absolute left-4 right-4 items-center rounded-lg bg-red-600 py-4 active:bg-red-700"
      >
        <Text className="text-base font-bold text-white">+ Nova série</Text>
      </Pressable>
    </View>
  );
}
