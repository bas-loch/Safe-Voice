import React, { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import {
  useFonts,
  Baloo2_600SemiBold,
  Baloo2_700Bold,
  Baloo2_800ExtraBold,
} from '@expo-google-fonts/baloo-2';
import {
  useFonts as useNunitoFonts,
  Nunito_600SemiBold,
  Nunito_700Bold,
  Nunito_800ExtraBold,
} from '@expo-google-fonts/nunito';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { MainScreen } from './src/screens/MainScreen';

SplashScreen.preventAutoHideAsync();

export default function App() {
  const [appReady, setAppReady] = useState(false);

  const [balooLoaded] = useFonts({
    Baloo2_600SemiBold,
    Baloo2_700Bold,
    Baloo2_800ExtraBold,
  });

  const [nunitoLoaded] = useNunitoFonts({
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
  });

  useEffect(() => {
    if (balooLoaded && nunitoLoaded) {
      setAppReady(true);
      SplashScreen.hideAsync();
    }
  }, [balooLoaded, nunitoLoaded]);

  if (!appReady) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <MainScreen />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({});
