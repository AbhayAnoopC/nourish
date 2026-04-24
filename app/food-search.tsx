import { useCallback, useRef } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorScheme } from '@/components/useColorScheme';
import { FoodSearchResultItem } from '@/components/FoodSearchResultItem';
import Colors from '@/constants/Colors';
import { BORDER_RADIUS, FONT_SIZE, SPACING } from '@/constants/Spacing';
import { useFoodSearch } from '@/hooks/useFoodSearch';
import { useLogFlowStore } from '@/store/logFlowStore';
import { SearchResult } from '@/types';

export default function FoodSearchScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const insets = useSafeAreaInsets();
  const { query, results, loading, error, setQuery, clear } = useFoodSearch();
  const setPendingItem = useLogFlowStore((s) => s.setPendingItem);
  const inputRef = useRef<TextInput>(null);

  const handleSelect = useCallback(
    (item: SearchResult) => {
      setPendingItem(item);
      router.push('/confirm-food');
    },
    [setPendingItem],
  );

  const handleClear = useCallback(() => {
    clear();
    inputRef.current?.focus();
  }, [clear]);

  const showEmptyHint = !loading && query.length < 2 && results.length === 0;
  const showError = !loading && error !== null;
  const showResults = !loading && results.length > 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          title: 'Search Food',
          headerStyle: { backgroundColor: colors.card },
          headerTintColor: colors.text,
          headerShadowVisible: false,
        }}
      />

      {/* Search bar */}
      <View style={[styles.searchBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <TextInput
          ref={inputRef}
          style={[styles.input, { color: colors.text }]}
          placeholder="Search foods…"
          placeholderTextColor={colors.placeholder}
          value={query}
          onChangeText={setQuery}
          autoFocus
          returnKeyType="search"
          clearButtonMode="never"
          autoCapitalize="none"
          autoCorrect={false}
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={handleClear} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={[styles.clearButton, { color: colors.placeholder }]}>{'\u00d7'}</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* States */}
      {loading && (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.tint} />
          <Text style={[styles.hintText, { color: colors.placeholder }]}>Searching…</Text>
        </View>
      )}

      {showEmptyHint && (
        <View style={styles.centered}>
          <Text style={[styles.hintText, { color: colors.placeholder }]}>
            Type at least 2 characters to search USDA and Open Food Facts.
          </Text>
        </View>
      )}

      {showError && (
        <View style={styles.centered}>
          <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>
        </View>
      )}

      {showResults && (
        <FlatList<SearchResult>
          data={results}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <FoodSearchResultItem item={item} onSelect={handleSelect} />
          )}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: insets.bottom + SPACING.lg }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: SPACING.md,
    marginVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    paddingHorizontal: SPACING.md,
  },
  input: {
    flex: 1,
    height: 44,
    fontSize: FONT_SIZE.md,
  },
  clearButton: {
    fontSize: 22,
    lineHeight: 22,
    paddingLeft: SPACING.sm,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
  },
  hintText: {
    fontSize: FONT_SIZE.md,
    textAlign: 'center',
    lineHeight: FONT_SIZE.md * 1.6,
    marginTop: SPACING.md,
  },
  errorText: {
    fontSize: FONT_SIZE.md,
    textAlign: 'center',
    lineHeight: FONT_SIZE.md * 1.6,
  },
});
