import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import ScreenContainer from '../components/ScreenContainer';
import Button from '../components/Button';
import { createPost } from '../services/boardService';
import { useUserStore } from '../store/userStore';

type Props = NativeStackScreenProps<RootStackParamList, 'CreatePost'>;

export const CreatePostScreen: React.FC<Props> = ({ route, navigation }) => {
    const { user } = useUserStore();
    const initialCategory = route.params?.category || 'jobs';

    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [category, setCategory] = useState(initialCategory);
    const [price, setPrice] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!title.trim() || !content.trim()) {
            Alert.alert('알림', '제목과 내용을 모두 입력해주세요.');
            return;
        }

        if (!user) {
            Alert.alert('알림', '로그인이 필요합니다.');
            return;
        }

        setIsSubmitting(true);
        try {
            await createPost({
                title: title.trim(),
                content: content.trim(),
                category: category as 'jobs' | 'real_estate' | 'marketplace' | 'news' | 'announcements',
                price: price ? parseInt(price, 10) : undefined,
                authorId: user.id || 'anonymous',
                authorName: user.displayName || '익명 사용자',
                authorAvatar: user.photoUrl || undefined,
            });

            Alert.alert('완료', '게시글이 성공적으로 등록되었습니다.', [
                { text: '확인', onPress: () => navigation.goBack() }
            ]);
        } catch (error) {
            console.error(error);
            Alert.alert('오류', '게시글 등록에 실패했습니다.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const showPriceInput = category === 'real_estate' || category === 'marketplace';

    return (
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <ScreenContainer scrollable={true}>
                <View style={styles.formContainer}>
                    {/* Category Selector (Simplistic for MVP) */}
                    <Text style={styles.label}>카테고리</Text>
                    <View style={styles.categoryContainer}>
                        {['jobs', 'real_estate', 'marketplace', 'news'].map((cat) => (
                            <View key={cat} style={styles.categoryButtonWrapper}>
                                <Button
                                    title={cat.toUpperCase()}
                                    onPress={() => setCategory(cat as any)}
                                    variant={category === cat ? 'primary' : 'outline'}
                                />
                            </View>
                        ))}
                    </View>

                    {/* Title Input */}
                    <Text style={styles.label}>제목</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="제목을 입력하세요"
                        value={title}
                        onChangeText={setTitle}
                        maxLength={100}
                    />

                    {/* Price Input (Conditional) */}
                    {showPriceInput && (
                        <>
                            <Text style={styles.label}>가격 ($)</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="가격을 입력하세요 (숫자만)"
                                value={price}
                                onChangeText={setPrice}
                                keyboardType="numeric"
                            />
                        </>
                    )}

                    {/* Content Input */}
                    <Text style={styles.label}>내용</Text>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        placeholder="본문 내용을 입력하세요"
                        value={content}
                        onChangeText={setContent}
                        multiline
                        textAlignVertical="top"
                    />

                    <View style={styles.submitButtonWrapper}>
                        <Button
                            title={isSubmitting ? "등록 중..." : "게시글 등록"}
                            onPress={handleSubmit}
                            isLoading={isSubmitting}
                        />
                    </View>
                </View>
            </ScreenContainer>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    formContainer: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 8,
    },
    label: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
        marginTop: 16,
    },
    categoryContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    categoryButtonWrapper: {
        // Wrap to avoid Button needing style prop
        marginRight: 4,
        marginBottom: 4,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        backgroundColor: '#fafafa',
    },
    textArea: {
        minHeight: 200,
    },
    submitButtonWrapper: {
        marginTop: 32,
    },
});
