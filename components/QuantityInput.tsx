import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Plus } from 'lucide-react-native';
import { useTokens } from '@/hooks/useTokens';
import { Type } from '@/constants/Typography';
import { BORDER_RADIUS, SPACING } from '@/constants/Spacing';
import { ServingChip } from './ServingChip';
import { SaveCustomServingModal } from './SaveCustomServingModal';
import { useServingOptions } from '@/hooks/useServingOptions';
import { useCustomServingsStore } from '@/store/customServingsStore';
import { normalizeFoodName } from '@/utils/normalizeFoodName';
import { parseCustomAmount, type CustomAmountUnit } from '@/utils/parseCustomAmount';
import { modifierToMl } from '@/utils/volumeConversions';
import { useUserStore } from '@/store/userStore';
import type { SearchResult, ServingOption } from '@/types';

interface QuantityInputProps {
  food: SearchResult;
  onChange: (grams: number, label: string) => void;
}

const UNITS: CustomAmountUnit[] = ['g', 'ml', 'oz'];

function pickDefaultOption(options: ServingOption[]): ServingOption | null {
  if (options.length === 0) return null;
  // 1. Exact-match custom (saved on this exact food name) wins
  const exactCustom = options.find((o) => o.source === 'custom' && o.isFuzzyMatch === false);
  if (exactCustom) return exactCustom;
  // 2. USDA portion closest to 100g
  const usda = options.filter((o) => o.source === 'usda');
  if (usda.length > 0) {
    return usda.reduce((best, cur) =>
      Math.abs(cur.grams - 100) < Math.abs(best.grams - 100) ? cur : best,
    );
  }
  // 3. 100g fallback
  const fallback = options.find((o) => o.label === '100 g');
  return fallback ?? options[0];
}

function detectGramsPerMl(food: SearchResult): number | undefined {
  if (!food.foodPortions) return undefined;
  for (const p of food.foodPortions) {
    // Strip leading amount (e.g. "1 cup, chopped" -> "cup, chopped")
    const modifier = p.label.replace(/^[\d.]+\s*/, '');
    const ml = modifierToMl(modifier);
    if (ml !== null && ml > 0) {
      return p.gramWeight / ml;
    }
  }
  return undefined;
}

export function QuantityInput({ food, onChange }: QuantityInputProps) {
  const tokens = useTokens();
  const profileUnits = useUserStore((s) => s.profile?.units);
  const options = useServingOptions(food);
  const addCustom = useCustomServingsStore((s) => s.addCustom);
  const removeCustom = useCustomServingsStore((s) => s.removeCustom);

  const [selectedOption, setSelectedOption] = useState<ServingOption | null>(() =>
    pickDefaultOption(options),
  );
  const [customMode, setCustomMode] = useState(false);
  const [customValue, setCustomValue] = useState('');
  const [customUnit, setCustomUnit] = useState<CustomAmountUnit>(
    profileUnits === 'imperial' ? 'oz' : 'g',
  );
  const [modalOpen, setModalOpen] = useState(false);

  const gramsPerMl = useMemo(() => detectGramsPerMl(food), [food]);
  const mlAvailable = gramsPerMl !== undefined;

  // Re-pick default when options change (e.g., a custom is added)
  useEffect(() => {
    if (!customMode && (selectedOption === null || !options.some((o) => o.label === selectedOption.label && o.grams === selectedOption.grams))) {
      const next = pickDefaultOption(options);
      setSelectedOption(next);
    }
  }, [options, selectedOption, customMode]);

  // Notify parent of grams + label changes
  useEffect(() => {
    if (customMode) {
      const value = parseFloat(customValue.replace(',', '.'));
      if (Number.isFinite(value) && value > 0) {
        try {
          const grams = parseCustomAmount(value, customUnit, gramsPerMl);
          onChange(grams, `${value} ${customUnit}`);
        } catch {
          onChange(0, '');
        }
      } else {
        onChange(0, '');
      }
    } else if (selectedOption) {
      onChange(selectedOption.grams, selectedOption.label);
    } else {
      onChange(0, '');
    }
  }, [customMode, customValue, customUnit, selectedOption, gramsPerMl, onChange]);

  const handleSelectChip = (opt: ServingOption) => {
    setCustomMode(false);
    setSelectedOption(opt);
  };

  const handleLongPressChip = (opt: ServingOption) => {
    if (opt.source !== 'custom' || !opt.customId) return;
    Alert.alert(
      `Saved for "${opt.label}"`,
      `${opt.grams} g per serving`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            removeCustom(opt.customId!);
            if (selectedOption === opt) {
              const next = pickDefaultOption(options.filter((o) => o.customId !== opt.customId));
              setSelectedOption(next);
            }
          },
        },
      ],
    );
  };

  const handleSaveCustom = (label: string, grams: number) => {
    const created = addCustom({
      matchKey: normalizeFoodName(food.foodName),
      label,
      grams,
    });
    setModalOpen(false);
    setSelectedOption({
      label,
      grams,
      source: 'custom',
      customId: created.id,
      isFuzzyMatch: false,
    });
    setCustomMode(false);
  };

  const handleCustomValueChange = (text: string) => {
    setCustomMode(true);
    setCustomValue(text);
  };

  const mlWarningVisible = customMode && customUnit === 'ml' && !mlAvailable;

  return (
    <View style={styles.container}>
      <Text style={[Type.textXs, { color: tokens.text.secondary }, styles.heading]}>HOW MUCH?</Text>

      <View style={styles.chipRow}>
        {options.map((opt) => (
          <ServingChip
            key={`${opt.source}-${opt.label}-${opt.grams}`}
            option={opt}
            selected={!customMode && selectedOption?.label === opt.label && selectedOption?.grams === opt.grams}
            onPress={() => handleSelectChip(opt)}
            onLongPress={() => handleLongPressChip(opt)}
          />
        ))}

        <Pressable
          onPress={() => setModalOpen(true)}
          style={[styles.addChip, { borderColor: tokens.border.hairline }]}
        >
          <Plus size={14} color={tokens.text.secondary} />
          <Text style={[Type.textMd, { color: tokens.text.secondary }]}>Custom</Text>
        </Pressable>
      </View>

      <Text style={[Type.textSm, { color: tokens.text.tertiary }, styles.divider]}>
        — or type a custom amount —
      </Text>

      <View style={styles.customRow}>
        <TextInput
          style={[
            Type.textLg,
            styles.customInput,
            { color: tokens.text.primary, backgroundColor: tokens.bg.surfaceMuted, fontFamily: 'JetBrainsMono_500Medium' },
          ]}
          value={customValue}
          onChangeText={handleCustomValueChange}
          placeholder="0"
          placeholderTextColor={tokens.text.tertiary}
          keyboardType="decimal-pad"
          maxLength={6}
        />

        <View style={styles.unitGroup}>
          {UNITS.map((u) => {
            const enabled = u !== 'ml' || mlAvailable;
            const active = customUnit === u;
            return (
              <Pressable
                key={u}
                disabled={!enabled}
                onPress={() => {
                  setCustomMode(true);
                  setCustomUnit(u);
                }}
                style={[
                  styles.unitChip,
                  {
                    backgroundColor: active ? tokens.accent.primary : tokens.bg.surface,
                    borderColor: active ? tokens.accent.primary : tokens.border.hairline,
                    opacity: enabled ? 1 : 0.4,
                  },
                ]}
              >
                <Text style={[Type.textSm, { color: active ? '#FFFFFF' : tokens.text.primary }]}>
                  {u}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {mlWarningVisible && (
        <Text style={[Type.textSm, { color: tokens.status.warning }]}>
          ml not available for this food (no volume data).
        </Text>
      )}

      <SaveCustomServingModal
        visible={modalOpen}
        forFoodName={food.foodName}
        onSave={handleSaveCustom}
        onDismiss={() => setModalOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: SPACING.sm,
  },
  heading: {
    marginBottom: SPACING.xs,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  addChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1.5,
    borderStyle: 'dashed',
  },
  divider: {
    textAlign: 'center',
    marginVertical: SPACING.sm,
  },
  customRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  customInput: {
    flex: 1,
    height: 48,
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.md,
    textAlign: 'center',
  },
  unitGroup: {
    flexDirection: 'row',
    gap: 4,
  },
  unitChip: {
    paddingHorizontal: SPACING.md,
    height: 48,
    borderRadius: BORDER_RADIUS.button,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
