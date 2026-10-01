import { useCallback, useState } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getSeries } from '../src/database/serieRepository';
import type { Serie, SerieFilter } from '../src/types/serie';

const FILTROS: { valor: SerieFilter; rotulo: string }[] = [
  { valor: 'todas', rotulo: 'Todas' },
  { valor: 'assistindo', rotulo: 'Assistindo' },
  { valor: 'concluidas', rotulo: 'Concluídas' },
];

export default function Home() {
  const [filtro, setFiltro] = useState<SerieFilter>('todas');
  const [series, setSeries] = useState<Serie[]>([]);
  // Altura da barra de navegação do Android (voltar/home/recentes), que varia por aparelho.
  const insets = useSafeAreaInsets();

  // Recarrega ao focar a tela (ex.: voltando do /form) e quando o filtro muda.
  useFocusEffect(
    useCallback(() => {
      getSeries(filtro).then(setSeries);
    }, [filtro]),
  );

  return (
    <View className="flex-1 bg-black px-4 pt-4">
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

      <FlatList
        data={series}
        keyExtractor={(item) => String(item.id)}
        contentContainerClassName="gap-3"
        contentContainerStyle={{ paddingBottom: insets.bottom + 96 }}
        ListEmptyComponent={
          <Text className="mt-16 text-center text-neutral-500">Nenhuma série encontrada.</Text>
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
