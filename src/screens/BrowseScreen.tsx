import React from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import { BoardListScreen } from './BoardListScreen';

type Props = NativeStackScreenProps<RootStackParamList, 'Browse'>;

export default function BrowseScreen({ route }: Props) {
  const { title, category, initialFilters, hideCreateButton } = route.params;

  return (
    <BoardListScreen
      title={title}
      category={category}
      initialFilters={initialFilters}
      hideCreateButton={hideCreateButton}
    />
  );
}
