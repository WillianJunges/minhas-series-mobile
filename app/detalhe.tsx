import { useCallback, useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { deleteSerie, getSerieById, toggleSerieConcluida } from '../src/database/serieRepository';
import type { Serie } from '../src/types/serie';

export default function Detalhe() {
  // Sem "?": esta tela sempre é aberta com um id.
  const { id } = useLocalSearchParams<{ id: string }>();
  // null enquanto a série ainda não foi carregada do banco.
  const [serie, setSerie] = useState<Serie | null>(null);
  // Altura da barra de navegação do Android, para os botões não ficarem atrás dela.
  const insets = useSafeAreaInsets();

  // Função separada porque também é chamada depois de alternar o status.
  const carregar = useCallback(() => {
    getSerieById(Number(id)).then(setSerie);
  }, [id]);

  // useFocusEffect (e não useEffect) para recarregar ao voltar do /form com dados editados.
  useFocusEffect(carregar);

  if (!serie) {
    return <View className="flex-1 bg-black" />;
  }

  const concluida = serie.concluida === 1;

  const alternarStatus = async () => {
    await toggleSerieConcluida(serie.id);
    carregar(); // relê do banco para a tela mostrar o novo status
  };

  const confirmarExclusao = () => {
    Alert.alert('Excluir série', `Excluir "${serie.titulo}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          await deleteSerie(serie.id);
          router.back();
        },
      },
    ]);
  };

  return (
    <View className="flex-1 bg-black">
      {/* Capa: faixa vermelha + título grande, estilo página de série da Netflix */}
      <View className="border-b-4 border-red-600 bg-neutral-950 px-4 pb-6 pt-8">
        <View
          className={`mb-3 self-start rounded-full px-3 py-1 ${
            concluida ? 'bg-green-600/20' : 'bg-red-600/20'
          }`}
        >
          <Text className={`text-xs font-bold ${concluida ? 'text-green-500' : 'text-red-500'}`}>
            {concluida ? '✓ CONCLUÍDA' : '● ASSISTINDO'}
          </Text>
        </View>
        <Text className="text-4xl font-black text-white">{serie.titulo}</Text>
        <Text className="mt-1 text-lg text-neutral-400">{serie.plataforma}</Text>
      </View>

      {/* Informações em "cartões" lado a lado */}
      <View className="flex-row gap-3 px-4 pt-6">
        <View className="flex-1 rounded-lg bg-neutral-900 p-4">
          <Text className="text-xs uppercase text-neutral-500">Temporadas</Text>
          <Text className="mt-1 text-2xl font-bold text-white">{serie.temporadas}</Text>
        </View>
        <View className="flex-1 rounded-lg bg-neutral-900 p-4">
          <Text className="text-xs uppercase text-neutral-500">Nota</Text>
          {serie.nota === null ? (
            <Text className="mt-2 text-base text-neutral-500">Sem nota</Text>
          ) : (
            <Text className="mt-1 text-2xl text-yellow-400">{'★'.repeat(serie.nota)}</Text>
          )}
        </View>
      </View>

      <Text className="px-4 pt-4 text-sm text-neutral-500">
        Cadastrada em {new Date(serie.createdAt).toLocaleDateString('pt-BR')}
      </Text>

      {/* Ações presas no rodapé, acima da barra do Android */}
      <View className="mt-auto gap-3 px-4" style={{ paddingBottom: insets.bottom + 16 }}>
        <Pressable
          onPress={alternarStatus}
          className={`items-center rounded-lg py-4 ${
            concluida ? 'bg-neutral-800 active:bg-neutral-700' : 'bg-red-600 active:bg-red-700'
          }`}
        >
          <Text className="text-base font-bold text-white">
            {concluida ? '↺ Voltar para assistindo' : '✓ Marcar como concluída'}
          </Text>
        </Pressable>

        <View className="flex-row gap-3">
          <Pressable
            onPress={() => router.push(`/form?id=${serie.id}`)}
            className="flex-1 items-center rounded-lg bg-neutral-800 py-4 active:bg-neutral-700"
          >
            <Text className="text-base font-bold text-white">✎ Editar</Text>
          </Pressable>

          <Pressable
            onPress={confirmarExclusao}
            className="flex-1 items-center rounded-lg border border-red-600 py-4 active:bg-red-600/20"
          >
            <Text className="text-base font-bold text-red-500">🗑 Excluir</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
