import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTokens } from '@/hooks/useTokens';
import { Type } from '@/constants/Typography';
import { SPACING } from '@/constants/Spacing';
import { useCustomServingsStore } from '@/store/customServingsStore';
import { SaveCustomServingModal } from './SaveCustomServingModal';
import type { CustomServing } from '@/types';

export function SavedServingsList() {
  const tokens = useTokens();
  const customs = useCustomServingsStore((s) => s.customs);
  const removeCustom = useCustomServingsStore((s) => s.removeCustom);
  const addCustom = useCustomServingsStore((s) => s.addCustom);
  const [editing, setEditing] = useState<CustomServing | null>(null);

  if (customs.length === 0) return null;

  const handleEdit = (c: CustomServing) => setEditing(c);

  const handleSaveEdit = (label: string, grams: number) => {
    if (!editing) return;
    // Editing = remove old, add new (keeps schema simple)
    removeCustom(editing.id);
    addCustom({ matchKey: editing.matchKey, label, grams });
    setEditing(null);
  };

  const handleLongPress = (c: CustomServing) => {
    Alert.alert(c.label, `Saved for "${c.matchKey}" · ${c.grams} g`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Edit', onPress: () => handleEdit(c) },
      { text: 'Delete', style: 'destructive', onPress: () => removeCustom(c.id) },
    ]);
  };

  return (
    <View>
      <Text style={[Type.textXs, { color: tokens.text.secondary }, styles.sectionHeading]}>
        SAVED SERVINGS
      </Text>
      {customs.map((c, i) => {
        const isLast = i === customs.length - 1;
        return (
          <Pressable
            key={c.id}
            onPress={() => handleEdit(c)}
            onLongPress={() => handleLongPress(c)}
            style={[
              styles.row,
              {
                backgroundColor: tokens.bg.surface,
                borderBottomColor: isLast ? 'transparent' : tokens.border.hairline,
              },
            ]}
          >
            <View style={styles.left}>
              <Text style={[Type.textLg, { color: tokens.text.primary }]} numberOfLines={1}>
                {c.label}
              </Text>
              <Text style={[Type.textSm, { color: tokens.text.secondary }]} numberOfLines={1}>
                saved for "{c.matchKey}"
              </Text>
            </View>
            <Text style={[Type.monoMd, { color: tokens.text.primary }]}>{c.grams} g</Text>
          </Pressable>
        );
      })}

      <SaveCustomServingModal
        visible={editing !== null}
        forFoodName={editing?.matchKey ?? ''}
        initialLabel={editing?.label}
        initialGrams={editing?.grams}
        onSave={handleSaveEdit}
        onDismiss={() => setEditing(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  sectionHeading: {
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    minHeight: 56,
    borderBottomWidth: 1,
  },
  left: {
    flex: 1,
    paddingRight: SPACING.md,
  },
});
