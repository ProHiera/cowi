import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";
import { Link } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import { WebView } from "react-native-webview";

type WebViewError = {
  nativeEvent: {
    description: string;
  };
};

const STORAGE_KEY = "cowi/mobile/base-url";
const DEFAULT_URL = Constants.expoConfig?.extra?.defaultBaseUrl ?? "https://cowi.vercel.app";

export default function WebShellScreen() {
  const webViewRef = useRef<WebView>(null);
  const [baseUrl, setBaseUrl] = useState(DEFAULT_URL);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored: string | null) => {
        if (stored) {
          setBaseUrl(stored);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const handleReload = useCallback(() => {
    setError(null);
    webViewRef.current?.reload();
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" />
        <Text style={styles.hint}>Preparing mobile shell...</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.centered}>
        <Text style={styles.error}>Failed to reach {baseUrl}</Text>
        <Text style={styles.hint}>{error}</Text>
        <Link href="/settings" style={styles.link}>
          Open settings
        </Link>
        <Text onPress={handleReload} style={styles.link}>
          Retry
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View pointerEvents="box-none" style={styles.overlay}>
        <Link href="/settings" asChild>
          <Pressable style={styles.settingsButton}>
            <Text style={styles.settingsButtonText}>Settings</Text>
          </Pressable>
        </Link>
        <View style={styles.banner}>
          <Text style={styles.bannerText}>
            Sign in with your Cowi account inside the shell. Use Settings to switch between prod and staging or to
            troubleshoot login loops.
          </Text>
        </View>
      </View>
      <WebView
        ref={webViewRef}
        source={{ uri: baseUrl }}
        onLoadStart={() => setError(null)}
        onError={(event: WebViewError) => setError(event.nativeEvent.description)}
        startInLoadingState
        renderLoading={() => (
          <View style={styles.webviewLoading}>
            <ActivityIndicator />
            <Text style={styles.hint}>Syncing studio...</Text>
          </View>
        )}
        userAgent={`cowi-mobile/${Constants.expoConfig?.version ?? "0.1"}`}
        allowsBackForwardNavigationGestures
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  overlay: {
    position: "absolute",
    top: 16,
    left: 16,
    right: 16,
    zIndex: 10,
    gap: 12,
  },
  settingsButton: {
    alignSelf: "flex-end",
    backgroundColor: "rgba(17, 24, 39, 0.9)",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
  },
  settingsButtonText: {
    color: "#f9fafb",
    fontWeight: "600",
  },
  banner: {
    backgroundColor: "rgba(15, 118, 110, 0.9)",
    borderRadius: 12,
    padding: 12,
  },
  bannerText: {
    color: "#ecfeff",
    fontSize: 12,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 8,
  },
  hint: {
    fontSize: 14,
    color: "#6b7280",
  },
  error: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ef4444",
    textAlign: "center",
  },
  link: {
    color: "#2563eb",
    fontWeight: "600",
  },
  webviewLoading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
});
