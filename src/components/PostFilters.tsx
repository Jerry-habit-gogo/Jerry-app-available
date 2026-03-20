import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Post, PostFilterOptions } from '../types';
import { color, radius, spacing, typography } from '../theme/tokens';

interface FilterChipOption<T extends string> {
  label: string;
  value: T | '';
}

interface PostFiltersProps {
  category?: Post['category'];
  filters: PostFilterOptions;
  onChange: (nextFilters: PostFilterOptions) => void;
}

const SEARCH_CATEGORY_OPTIONS: Array<{ label: string; value: 'jobs' | 'real_estate' | 'marketplace' }> = [
  { label: '구인구직', value: 'jobs' },
  { label: '부동산', value: 'real_estate' },
  { label: '중고장터', value: 'marketplace' },
];
const SEARCH_CATEGORY_VALUES: Array<'jobs' | 'real_estate' | 'marketplace'> = [
  'jobs',
  'real_estate',
  'marketplace',
];

const REGION_OPTIONS: FilterChipOption<string>[] = [
  { label: '전체 지역', value: '' },
  { label: '시드니', value: '시드니' },
  { label: '멜버른', value: '멜버른' },
  { label: '브리즈번', value: '브리즈번' },
  { label: '골드코스트', value: '골드코스트' },
  { label: '퍼스', value: '퍼스' },
];

const JOB_TYPE_OPTIONS: FilterChipOption<NonNullable<Post['jobType']>>[] = [
  { label: '전체 고용형태', value: '' },
  { label: '정규직', value: 'full_time' },
  { label: '파트타임', value: 'part_time' },
  { label: '계약직', value: 'contract' },
];

const REAL_ESTATE_OPTIONS: FilterChipOption<NonNullable<Post['realEstateType']>>[] = [
  { label: '전체 매물형태', value: '' },
  { label: '스튜디오', value: 'studio' },
  { label: '아파트', value: 'apartment' },
  { label: '하우스', value: 'house' },
];

const MARKETPLACE_OPTIONS: FilterChipOption<NonNullable<Post['marketplaceCondition']>>[] = [
  { label: '전체 상태', value: '' },
  { label: '새 상품', value: 'new' },
  { label: '중고', value: 'used' },
];

function FilterRow<T extends string>({
  label,
  selectedValue,
  options,
  onSelect,
}: {
  label: string;
  selectedValue?: T | '';
  options: FilterChipOption<T>[];
  onSelect: (value: T | '') => void;
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {options.map((option) => {
          const isActive = (selectedValue || '') === option.value;

          return (
            <TouchableOpacity
              key={`${label}-${option.value || 'all'}`}
              style={[styles.chip, isActive && styles.chipActive]}
              onPress={() => onSelect(option.value)}
              activeOpacity={0.8}
            >
              <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

export default function PostFilters({ category, filters, onChange }: PostFiltersProps) {
  const selectedCategories =
    filters.categories && filters.categories.length > 0
      ? filters.categories
      : SEARCH_CATEGORY_VALUES;
  const isAllSelected = SEARCH_CATEGORY_VALUES.every((value) => selectedCategories.includes(value));

  const toggleCategory = (value: 'jobs' | 'real_estate' | 'marketplace') => {
    onChange({ ...filters, categories: [value] });
  };

  return (
    <View style={styles.container}>
      {!category && (
        <View style={styles.row}>
          <Text style={styles.rowLabel}>카테고리</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <TouchableOpacity
              key="search-category-all"
              style={[styles.chip, isAllSelected && styles.chipActive]}
              onPress={() => onChange({ ...filters, categories: SEARCH_CATEGORY_VALUES })}
              activeOpacity={0.8}
            >
              <Text style={[styles.chipText, isAllSelected && styles.chipTextActive]}>
                전체
              </Text>
            </TouchableOpacity>
            {SEARCH_CATEGORY_OPTIONS.map((option) => {
              const isActive = !isAllSelected && selectedCategories.includes(option.value);
              return (
                <TouchableOpacity
                  key={`search-category-${option.value}`}
                  style={[styles.chip, isActive && styles.chipActive]}
                  onPress={() => toggleCategory(option.value)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      <FilterRow
        label="지역"
        selectedValue={filters.region || ''}
        options={REGION_OPTIONS}
        onSelect={(value) => onChange({ ...filters, region: value || undefined })}
      />

      {category === 'jobs' && (
        <FilterRow
          label="고용형태"
          selectedValue={filters.jobType || ''}
          options={JOB_TYPE_OPTIONS}
          onSelect={(value) => onChange({ ...filters, jobType: value || undefined })}
        />
      )}

      {category === 'real_estate' && (
        <FilterRow
          label="매물형태"
          selectedValue={filters.realEstateType || ''}
          options={REAL_ESTATE_OPTIONS}
          onSelect={(value) => onChange({ ...filters, realEstateType: value || undefined })}
        />
      )}

      {category === 'marketplace' && (
        <FilterRow
          label="상품상태"
          selectedValue={filters.marketplaceCondition || ''}
          options={MARKETPLACE_OPTIONS}
          onSelect={(value) => onChange({ ...filters, marketplaceCondition: value || undefined })}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: color.bg.surface,
    borderRadius: radius.sm,
    paddingVertical: 14,
    paddingHorizontal: 14,
    marginTop: spacing[12],
    marginBottom: spacing[12],
  },
  row: {
    marginBottom: spacing[12],
  },
  rowLabel: {
    fontSize: typography.size.bodySmall,
    fontWeight: typography.weight.bold,
    color: color.text.secondary,
    marginBottom: spacing[8],
  },
  chip: {
    borderWidth: 1,
    borderColor: color.line.default,
    borderRadius: radius.md,
    paddingHorizontal: spacing[12],
    paddingVertical: spacing[8],
    marginRight: spacing[8],
    backgroundColor: color.bg.subtle,
  },
  chipActive: {
    backgroundColor: color.brand.greenLight,
    borderColor: color.brand.green,
  },
  chipText: {
    fontSize: typography.size.bodySmall,
    color: color.text.secondary,
    fontWeight: typography.weight.medium,
  },
  chipTextActive: {
    color: color.brand.greenDark,
    fontWeight: typography.weight.semiBold,
  },
});
