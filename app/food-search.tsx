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
import { useTokens } from '@/hooks/useTokens';
import { FoodSearchResultItem } from '@/components/FoodSearchResultItem';
import { Type } from '@/constants/Typography';
import { BORDER_RADIUS, SPACING } from '@/constants/Spacing';
import { useFoodSearch } from '@/hooks/useFoodSearch';
import { useLogFlowStore } from '@/store/logFlowStore';
import { SearchResult } from '@/types';

export default function FoodSearchScreen() {
  const tokens = useTokens();
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
    <View style={[styles.container, { backgroundColor: tokens.bg.primary }]}>
      <Stack.Screen
        options={{
          title: 'Search Food',
          headerStyle: { backgroundColor: tokens.bg.surface },
          headerTintColor: tokens.text.primary,
          headerShadowVisible: false,
        }}
      />

      {/* Search bar */}
      <View style={[styles.searchBar, { backgroundColor: tokens.bg.surface }]}>
        <TextInput
          ref={inputRef}
          style={[Type.textMd, styles.input, { color: tokens.text.primary }]}
          placeholder="Search foods…"
          placeholderTextColor={tokens.text.tertiary}
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
            <Text style={[styles.clearButton, { color: tokens.text.secondary }]}>{'×'}</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* States */}
      {loading && (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={tokens.accent.primary} />
          <Text style={[Type.textMd, { color: tokens.text.secondary }, styles.hintText]}>Searching…</Text>
        </View>
      )}

      {showEmptyHint && (
        <View style={styles.centered}>
          <Text style={[Type.textMd, { color: tokens.text.secondary }, styles.hintText]}>
            Type at least 2 characters to search USDA and Open Food Facts.
          </Text>
        </View>
      )}

      {showError && (
        <View style={styles.centered}>
          <Text style={[Type.textMd, { color: tokens.status.danger }, styles.errorText]}>{error}</Text>
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
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.md,
    height: 48,
  },
  input: {
    flex: 1,
    height: 48,
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
    textAlign: 'center',
    marginTop: SPACING.md,
  },
  errorText: {
    textAlign: 'center',
  },
});
