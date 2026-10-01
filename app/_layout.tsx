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

  return <Stack />;
}
