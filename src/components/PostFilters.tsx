import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Post, PostFilterOptions, PostSortOption } from '../types';

interface FilterChipOption<T extends string> {
  label: string;
  value: T | '';
}

interface PostFiltersProps {
  category?: Post['category'];
  filters: PostFilterOptions;
  onChange: (nextFilters: PostFilterOptions) => void;
}

const SORT_OPTIONS: FilterChipOption<PostSortOption>[] = [
  { label: '최신순', value: 'latest' },
  { label: '낮은 가격순', value: 'price_low' },
  { label: '높은 가격순', value: 'price_high' },
];

const REGION_OPTIONS: FilterChipOption<string>[] = [
  { label: '전체 지역', value: '' },
  { label: 'Sydney', value: 'Sydney' },
  { label: 'Strathfield', value: 'Strathfield' },
  { label: 'Chatswood', value: 'Chatswood' },
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
  return (
    <View style={styles.container}>
      <FilterRow
        label="정렬"
        selectedValue={filters.sortBy || 'latest'}
        options={SORT_OPTIONS}
        onSelect={(value) => onChange({ ...filters, sortBy: value || 'latest' })}
      />

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
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 14,
    marginTop: 12,
    marginBottom: 12,
  },
  row: {
    marginBottom: 12,
  },
  rowLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 8,
  },
  chip: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    backgroundColor: '#fff',
  },
  chipActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  chipText: {
    fontSize: 13,
    color: '#4B5563',
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#fff',
  },
});
