import { useEffect, useState } from 'react';
import { Alert, Pressable, Text, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { createSerie, getSerieById, updateSerie } from '../src/database/serieRepository';

const ESTRELAS = [1, 2, 3, 4, 5];

export default function Form() {
  // O id chega como texto ("3"); converter com Number(id) antes de usar no repositório.
  const { id } = useLocalSearchParams<{ id?: string }>();
  const editando = id !== undefined;

  const [titulo, setTitulo] = useState('');
  const [plataforma, setPlataforma] = useState('');
  // String porque o TextInput sempre entrega texto; vira número só ao salvar.
  const [temporadas, setTemporadas] = useState('');
  const [nota, setNota] = useState<number | null>(null);

  useEffect(() => {
    if (!editando) return;
    getSerieById(Number(id)).then((serie) => {
      if (!serie) return;
      setTitulo(serie.titulo);
      setPlataforma(serie.plataforma);
      setTemporadas(String(serie.temporadas));
      setNota(serie.nota);
    });
  }, [editando, id]);

  async function salvar() {
    const temps = Number(temporadas);

    if (!titulo.trim()) {
      Alert.alert('Atenção', 'Informe o título da série.');
      return;
    }
    if (!plataforma.trim()) {
      Alert.alert('Atenção', 'Informe a plataforma.');
      return;
    }
      if (!temporadas.trim() || !Number.isInteger(temps) || temps < 0) {
      Alert.alert('Atenção', 'Informe um número válido de temporadas.');
      return;
    }

    const dados = {
      titulo: titulo.trim(),
      plataforma: plataforma.trim(),
      temporadas: temps,
      nota,
    };

    if (editando) {
      await updateSerie(Number(id), dados);
    } else {
      await createSerie(dados);
    }

    router.back();
  }

  return (
    <View className="flex-1 bg-black p-4">
      <Text className="mb-1 text-sm font-semibold text-neutral-300">Título</Text>
      <TextInput
        value={titulo}
        onChangeText={setTitulo}
        placeholder="Ex.: F.R.I.E.N.D.S"
        placeholderTextColor="#737373"
        className="mb-4 rounded-lg bg-neutral-900 px-4 py-3 text-white"
      />
      <Text className="mb-1 text-sm font-semibold text-neutral-300">Plataforma</Text>
      <TextInput
        value={plataforma}
        onChangeText={setPlataforma}
        placeholder="Ex.: Netflix, Max, Prime Video"
        placeholderTextColor="#737373"
        className="mb-4 rounded-lg bg-neutral-900 px-4 py-3 text-white"
      />
      <Text className="mb-1 text-sm font-semibold text-neutral-300">Temporadas assistidas</Text>
      <TextInput
        value={temporadas}
        onChangeText={setTemporadas}
        placeholder="Ex.: 3"
        placeholderTextColor="#737373"
        keyboardType="numeric"
        className="mb-4 rounded-lg bg-neutral-900 px-4 py-3 text-white"
      />

      <Text className="mb-1 text-sm font-semibold text-neutral-300">
        Nota <Text className="font-normal text-neutral-500">(opcional, toque de novo para tirar)</Text>
      </Text>
      <View className="mb-6 flex-row gap-2">
        {ESTRELAS.map((n) => {
          const cheia = nota !== null && n <= nota;
          return (
            // Tocar na nota já selecionada remove a nota.
            <Pressable key={n} onPress={() => setNota(nota === n ? null : n)}>
              <Text className={`text-4xl ${cheia ? 'text-yellow-400' : 'text-neutral-600'}`}>
                {cheia ? '★' : '☆'}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Pressable
        onPress={salvar}
        className="items-center rounded-lg bg-red-600 py-4 active:bg-red-700"
      >
        <Text className="text-base font-bold text-white">
          {editando ? 'Salvar alterações' : 'Cadastrar'}
        </Text>
      </Pressable>
    </View>
  );
}
