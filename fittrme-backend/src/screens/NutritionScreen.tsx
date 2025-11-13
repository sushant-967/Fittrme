import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';

type MealItem = { id: string; name: string; calories: number; protein: number };

const FOOD_DB: Record<string, { calories: number; protein: number }> = {
  oats: { calories: 150, protein: 6 },
  egg: { calories: 78, protein: 6 },
  banana: { calories: 105, protein: 1.3 },
  chicken: { calories: 165, protein: 31 },
  rice: { calories: 200, protein: 4.3 },
  salad: { calories: 40, protein: 2 },
  yogurt: { calories: 120, protein: 6 },
};

const DAY_TARGETS = { calories: 2000, protein: 120 };

export default function NutritionScreen() {
  const [foodName, setFoodName] = useState('');
  const [calInput, setCalInput] = useState('');
  const [proteinInput, setProteinInput] = useState('');
  const [selectedMeal, setSelectedMeal] = useState<'breakfast' | 'lunch' | 'dinner'>(
    'breakfast',
  );

  const [breakfast, setBreakfast] = useState<MealItem[]>([]);
  const [lunch, setLunch] = useState<MealItem[]>([]);
  const [dinner, setDinner] = useState<MealItem[]>([]);

  function addFood() {
    if (!foodName.trim()) return;
    const key = foodName.trim().toLowerCase();
    let calories = Number(calInput || 0);
    let protein = Number(proteinInput || 0);
    if (FOOD_DB[key]) {
      calories = FOOD_DB[key].calories;
      protein = FOOD_DB[key].protein;
    }
    const item: MealItem = {
      id: Date.now().toString(),
      name: foodName.trim(),
      calories,
      protein,
    };
    if (selectedMeal === 'breakfast') setBreakfast((s) => [item, ...s]);
    if (selectedMeal === 'lunch') setLunch((s) => [item, ...s]);
    if (selectedMeal === 'dinner') setDinner((s) => [item, ...s]);

    setFoodName('');
    setCalInput('');
    setProteinInput('');
  }

  function removeItem(meal: string, id: string) {
    if (meal === 'breakfast') setBreakfast((s) => s.filter((i) => i.id !== id));
    if (meal === 'lunch') setLunch((s) => s.filter((i) => i.id !== id));
    if (meal === 'dinner') setDinner((s) => s.filter((i) => i.id !== id));
  }

  const totals = useMemo(() => {
    const all = [...breakfast, ...lunch, ...dinner];
    const calories = all.reduce((s, i) => s + i.calories, 0);
    const protein = all.reduce((s, i) => s + i.protein, 0);
    return { calories, protein };
  }, [breakfast, lunch, dinner]);

  const remaining = useMemo(() => {
    return {
      calories: Math.max(0, DAY_TARGETS.calories - totals.calories),
      protein: Math.max(0, DAY_TARGETS.protein - totals.protein),
    };
  }, [totals]);

  const suggestions = useMemo(() => {
    const recs: string[] = [];
    if (remaining.protein > 20) recs.push('Chicken breast, Greek yogurt, Protein shake');
    else if (remaining.protein > 5) recs.push('Yogurt, Egg, Cottage cheese');
    if (remaining.calories > 500) recs.push('Add rice/pasta, nuts, avocado');
    return recs;
  }, [remaining]);

  function renderMeal(title: string, data: MealItem[], mealKey: string) {
    return (
      <View style={styles.mealCard}>
        <Text style={styles.mealTitle}>
          {title} — {data.length} item{data.length !== 1 ? 's' : ''}
        </Text>
        <FlatList
          data={data}
          keyExtractor={(it) => it.id}
          renderItem={({ item }) => (
            <View style={styles.mealRow}>
              <View>
                <Text style={styles.mealName}>{item.name}</Text>
                <Text style={styles.mealMeta}>
                  {item.calories} kcal · {item.protein} g protein
                </Text>
              </View>
              <TouchableOpacity onPress={() => removeItem(mealKey, item.id)}>
                <Text style={styles.remove}>Remove</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.select({ ios: 'padding', android: undefined })}
    >
      <Text style={styles.title}>Nutrition</Text>

      <View style={styles.selectorRow}>
        <TouchableOpacity
          style={[styles.mealBtn, selectedMeal === 'breakfast' && styles.mealBtnActive]}
          onPress={() => setSelectedMeal('breakfast')}
        >
          <Text style={styles.mealBtnText}>🍳 Breakfast</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.mealBtn, selectedMeal === 'lunch' && styles.mealBtnActive]}
          onPress={() => setSelectedMeal('lunch')}
        >
          <Text style={styles.mealBtnText}>🥗 Lunch</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.mealBtn, selectedMeal === 'dinner' && styles.mealBtnActive]}
          onPress={() => setSelectedMeal('dinner')}
        >
          <Text style={styles.mealBtnText}>🍽 Dinner</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Food name (oats, egg, chicken)"
          placeholderTextColor="#7B8794"
          value={foodName}
          onChangeText={setFoodName}
        />
        <TextInput
          style={[styles.input, { width: 90 }]}
          keyboardType="numeric"
          placeholder="kcal"
          placeholderTextColor="#7B8794"
          value={calInput}
          onChangeText={setCalInput}
        />
        <TextInput
          style={[styles.input, { width: 90 }]}
          keyboardType="numeric"
          placeholder="protein g"
          placeholderTextColor="#7B8794"
          value={proteinInput}
          onChangeText={setProteinInput}
        />
      </View>

      <TouchableOpacity style={styles.addBtn} onPress={addFood}>
        <Text style={styles.addBtnText}>Add food</Text>
      </TouchableOpacity>

      <View style={styles.totals}>
        <Text style={styles.totalsText}>Consumed: <Text style={styles.highlight}>{totals.calories} kcal</Text> • <Text style={styles.highlight}>{totals.protein} g</Text> protein</Text>
        <Text style={styles.remainingText}>Left: <Text style={styles.highlightLight}>{remaining.calories} kcal</Text> • <Text style={styles.highlightLight}>{remaining.protein} g</Text> protein</Text>
      </View>

      {suggestions.length > 0 && (
        <View style={styles.suggestion}>
          <Text style={styles.suggestionTitle}>Suggested to meet targets</Text>
          <View style={styles.chipsRow}>
            {suggestions.map((s) => (
              <View key={s} style={styles.chip}>
                <Text style={styles.chipText}>{s}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {renderMeal('Breakfast', breakfast, 'breakfast')}
      {renderMeal('Lunch', lunch, 'lunch')}
      {renderMeal('Dinner', dinner, 'dinner')}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#0B1220' },
  title: { fontSize: 22, fontWeight: '800', color: '#E6EEF3', marginBottom: 10 },

  selectorRow: { flexDirection: 'row', marginBottom: 10, gap: 8 },
  mealBtn: {
    paddingVertical: 8, 
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: '#071428',
    borderWidth: 1,
    borderColor: '#142032',
  },
  mealBtnActive: { backgroundColor: '#7C3AED' },
  mealBtnText: { color: '#E6EEF3', fontWeight: '700' },

  inputRow: { flexDirection: 'row', marginBottom: 8, gap: 8 },
  input: {
    flex: 1,
    backgroundColor: '#0F1A2A',
    color: '#E6EEF3',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
  },

  addBtn: {
    backgroundColor: '#06B6D4',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  addBtnText: { color: '#071122', fontWeight: '800' },

  totals: { marginBottom: 8 },
  totalsText: { fontSize: 14, fontWeight: '700', color: '#E6EEF3' },
  highlight: { color: '#7EE7C8' },
  highlightLight: { color: '#9FB3C8' },
  remainingText: { color: '#98A2B3', marginTop: 4 },

  suggestion: { backgroundColor: '#071428', padding: 10, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: '#122033' },
  suggestionTitle: { color: '#E6EEF3', fontWeight: '700', marginBottom: 8 },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { backgroundColor: '#0F1A2A', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, marginRight: 8, borderWidth: 1, borderColor: '#142032' },
  chipText: { color: '#9FB3C8', fontWeight: '700' },

  mealCard: { backgroundColor: '#071022', padding: 10, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: '#122033' },
  mealTitle: { color: '#E6EEF3', fontWeight: '800', marginBottom: 6 },
  mealRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 },
  mealName: { fontSize: 15, fontWeight: '700', color: '#E6EEF3' },
  mealMeta: { fontSize: 12, color: '#98A2B3' },
  remove: { color: '#EF4444', fontWeight: '700' },
});