import { useEffect, useState } from "react";
import { Link } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import { Pressable, SafeAreaView, StyleSheet, Text, TextInput, View } from "react-native";

const STORAGE_KEY = "cowi/mobile/base-url";
const DEFAULT_URL = Constants.expoConfig?.extra?.defaultBaseUrl ?? "https://cowi.vercel.app";
const STAGING_URL = Constants.expoConfig?.extra?.stagingBaseUrl ?? DEFAULT_URL;

export default function SettingsScreen() {
  const [value, setValue] = useState(DEFAULT_URL);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
      if (stored) {
        setValue(stored);
      }
    });
  }, []);

  async function save(url: string) {
    await AsyncStorage.setItem(STORAGE_KEY, url);
    setValue(url);
    setStatus("Saved");
    setTimeout(() => setStatus(null), 1500);
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.label}>Base URL</Text>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={setValue}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <View style={styles.row}>
          <Pressable style={styles.button} onPress={() => save(value)}>
            <Text style={styles.buttonText}>Save</Text>
          </Pressable>
          <Pressable style={styles.secondaryButton} onPress={() => save(DEFAULT_URL)}>
            <Text style={styles.secondaryText}>Prod</Text>
          </Pressable>
          <Pressable style={styles.secondaryButton} onPress={() => save(STAGING_URL)}>
            <Text style={styles.secondaryText}>Stage</Text>
          </Pressable>
        </View>
        {status && <Text style={styles.status}>{status}</Text>}
      </View>
      <View style={styles.section}>
        <Text style={styles.label}>Need desktop?</Text>
        <Text style={styles.hint}>Open the Studio in a browser for full fidelity features.</Text>
        <Link href="/" style={styles.link}>
          Back to shell
        </Link>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    gap: 24,
  },
  section: {
    backgroundColor: "#f4f4f5",
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
  },
  input: {
    borderWidth: 1,
    borderColor: "#d4d4d8",
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
  },
  row: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  button: {
    backgroundColor: "#111827",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  buttonText: {
    color: "white",
    fontWeight: "600",
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: "#d4d4d8",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  secondaryText: {
    color: "#111827",
  },
  status: {
    color: "#16a34a",
    fontWeight: "600",
  },
  hint: {
    color: "#6b7280",
  },
  link: {
    color: "#2563eb",
    fontWeight: "600",
  },
});
