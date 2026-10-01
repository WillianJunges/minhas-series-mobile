import '../global.css';
import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { runMigrations } from '../src/database/database';

export default function RootLayout() {
  const [pronto, setPronto] = useState(false);

  useEffect(() => {
    runMigrations().then(() => setPronto(true));
  }, []);

  if (!pronto) return null;

    return (
        <Stack
            screenOptions={{
                headerStyle: { backgroundColor: '#000' },
                headerTintColor: '#dc2626',
                headerTitleStyle: { color: '#fff', fontWeight: 'bold' },
                contentStyle: { backgroundColor: '#000' },
            }}
        >
            <Stack.Screen name="index" options={{ title: 'Minhas Séries' }} />
            <Stack.Screen name="form" options={{ title: 'Série' }} />
            <Stack.Screen name="detalhe" options={{ title: 'Detalhes' }} />
        </Stack>
  );
}
