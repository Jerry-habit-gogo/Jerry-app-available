import React, { useLayoutEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    Alert,
    KeyboardAvoidingView,
    Platform,
    Image,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import ScreenContainer from '../components/ScreenContainer';
import Button from '../components/Button';
import { createPost, updatePost, uploadPostImages } from '../services/boardService';
import { useUserStore } from '../store/userStore';

type Props = NativeStackScreenProps<RootStackParamList, 'CreatePost'>;

export const CreatePostScreen: React.FC<Props> = ({ route, navigation }) => {
    const { user } = useUserStore();
    const existingPost = route.params?.post;
    const isEditMode = !!existingPost;
    const initialCategory = existingPost?.category || route.params?.category || 'jobs';

    const [title, setTitle] = useState(existingPost?.title || '');
    const [content, setContent] = useState(existingPost?.content || '');
    const [category, setCategory] = useState(initialCategory);
    const [price, setPrice] = useState(existingPost?.price != null ? String(existingPost.price) : '');
    const [region, setRegion] = useState(existingPost?.region || '');
    const [jobType, setJobType] = useState<'full_time' | 'part_time' | 'contract' | undefined>(existingPost?.jobType);
    const [realEstateType, setRealEstateType] = useState<'studio' | 'apartment' | 'house' | undefined>(existingPost?.realEstateType);
    const [marketplaceCondition, setMarketplaceCondition] = useState<'new' | 'used' | undefined>(existingPost?.marketplaceCondition);
    const [selectedImageUris, setSelectedImageUris] = useState<string[]>(existingPost?.images || []);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isPickingImage, setIsPickingImage] = useState(false);

    useLayoutEffect(() => {
        navigation.setOptions({
            title: isEditMode ? '게시글 수정' : '글쓰기',
        });
    }, [isEditMode, navigation]);

    const handlePickImages = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('알림', '사진 라이브러리 접근 권한이 필요합니다.');
            return;
        }

        setIsPickingImage(true);
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'] as ImagePicker.MediaType[],
                allowsMultipleSelection: true,
                selectionLimit: 5,
                quality: 0.8,
            });

            if (!result.canceled) {
                setSelectedImageUris(result.assets.map((a) => a.uri));
            }
        } finally {
            setIsPickingImage(false);
        }
    };

    const handleRemoveImage = (uri: string) => {
        setSelectedImageUris((prev) => prev.filter((u) => u !== uri));
    };

    const handleSubmit = async () => {
        if (!title.trim() || !content.trim()) {
            Alert.alert('알림', '제목과 내용을 모두 입력해주세요.');
            return;
        }

        if (price) {
            const parsedPrice = parseInt(price, 10);
            if (isNaN(parsedPrice) || parsedPrice < 0) {
                Alert.alert('알림', '올바른 가격을 입력해주세요.');
                return;
            }
            if (parsedPrice > 99999999) {
                Alert.alert('알림', '가격이 너무 큽니다.');
                return;
            }
        }

        if (!user) {
            Alert.alert('알림', '로그인이 필요합니다.', [
                { text: '취소', style: 'cancel' },
                { text: '로그인', onPress: () => navigation.navigate('Auth') },
            ]);
            return;
        }

        setIsSubmitting(true);
        try {
            const existingImageUrls = selectedImageUris.filter((uri) => uri.startsWith('http'));
            const newLocalImageUris = selectedImageUris.filter((uri) => !uri.startsWith('http'));
            const uploadedImageUrls = newLocalImageUris.length > 0
                ? await uploadPostImages(user.id, newLocalImageUris)
                : [];
            const imageUrls = [...existingImageUrls, ...uploadedImageUrls];

            const payload = {
                title: title.trim(),
                content: content.trim(),
                category: category as 'jobs' | 'real_estate' | 'marketplace' | 'news' | 'announcements',
                price: price ? parseInt(price, 10) : undefined,
                region: region.trim() || undefined,
                jobType: category === 'jobs' ? jobType : undefined,
                realEstateType: category === 'real_estate' ? realEstateType : undefined,
                marketplaceCondition: category === 'marketplace' ? marketplaceCondition : undefined,
                images: imageUrls.length > 0 ? imageUrls : undefined,
                authorId: user.id || 'anonymous',
                authorName: user.displayName || '익명 사용자',
                authorAvatar: user.photoUrl || undefined,
            };

            if (isEditMode && existingPost) {
                await updatePost(existingPost.id, payload);
            } else {
                await createPost(payload);
            }

            Alert.alert('완료', isEditMode ? '게시글이 수정되었습니다.' : '게시글이 성공적으로 등록되었습니다.', [
                { text: '확인', onPress: () => navigation.goBack() },
            ]);
        } catch (error) {
            console.error(error);
            Alert.alert('오류', isEditMode ? '게시글 수정에 실패했습니다.' : '게시글 등록에 실패했습니다.');
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
                    {/* Category Selector */}
                    <Text style={styles.label}>카테고리</Text>
                    <View style={styles.chipRow}>
                        {(['jobs', 'real_estate', 'marketplace', 'news'] as const).map((cat) => (
                            <TouchableOpacity
                                key={cat}
                                style={[styles.chip, category === cat && styles.chipActive]}
                                onPress={() => setCategory(cat)}
                            >
                                <Text style={[styles.chipText, category === cat && styles.chipTextActive]}>
                                    {cat.toUpperCase()}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Title */}
                    <Text style={styles.label}>제목</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="제목을 입력하세요"
                        value={title}
                        onChangeText={setTitle}
                        maxLength={100}
                    />

                    {/* Region */}
                    <Text style={styles.label}>지역</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="예: Sydney, Strathfield, Chatswood"
                        value={region}
                        onChangeText={setRegion}
                    />

                    {/* Job Type */}
                    {category === 'jobs' && (
                        <>
                            <Text style={styles.label}>고용형태</Text>
                            <View style={styles.chipRow}>
                                {([['full_time', '정규직'], ['part_time', '파트타임'], ['contract', '계약직']] as const).map(([value, label]) => (
                                    <TouchableOpacity
                                        key={value}
                                        style={[styles.chip, jobType === value && styles.chipActive]}
                                        onPress={() => setJobType(value)}
                                    >
                                        <Text style={[styles.chipText, jobType === value && styles.chipTextActive]}>{label}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </>
                    )}

                    {/* Real Estate Type */}
                    {category === 'real_estate' && (
                        <>
                            <Text style={styles.label}>매물형태</Text>
                            <View style={styles.chipRow}>
                                {([['studio', '스튜디오'], ['apartment', '아파트'], ['house', '하우스']] as const).map(([value, label]) => (
                                    <TouchableOpacity
                                        key={value}
                                        style={[styles.chip, realEstateType === value && styles.chipActive]}
                                        onPress={() => setRealEstateType(value)}
                                    >
                                        <Text style={[styles.chipText, realEstateType === value && styles.chipTextActive]}>{label}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </>
                    )}

                    {/* Marketplace Condition */}
                    {category === 'marketplace' && (
                        <>
                            <Text style={styles.label}>상품상태</Text>
                            <View style={styles.chipRow}>
                                {([['new', '새 상품'], ['used', '중고']] as const).map(([value, label]) => (
                                    <TouchableOpacity
                                        key={value}
                                        style={[styles.chip, marketplaceCondition === value && styles.chipActive]}
                                        onPress={() => setMarketplaceCondition(value)}
                                    >
                                        <Text style={[styles.chipText, marketplaceCondition === value && styles.chipTextActive]}>{label}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </>
                    )}

                    {/* Price */}
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

                    {/* Content */}
                    <Text style={styles.label}>내용</Text>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        placeholder="본문 내용을 입력하세요"
                        value={content}
                        onChangeText={setContent}
                        multiline
                        textAlignVertical="top"
                    />

                    {/* Image Picker */}
                    <Text style={styles.label}>사진 (최대 5장)</Text>
                    <TouchableOpacity
                        style={styles.imagePickerButton}
                        onPress={handlePickImages}
                        disabled={isPickingImage}
                    >
                        {isPickingImage ? (
                            <ActivityIndicator size="small" color="#3b82f6" />
                        ) : (
                            <Text style={styles.imagePickerText}>
                                {selectedImageUris.length > 0
                                    ? `${selectedImageUris.length}장 선택됨 — 변경하기`
                                    : '+ 사진 선택'}
                            </Text>
                        )}
                    </TouchableOpacity>

                    {selectedImageUris.length > 0 && (
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagePreviewRow}>
                            {selectedImageUris.map((uri) => (
                                <View key={uri} style={styles.imagePreviewItem}>
                                    <Image source={{ uri }} style={styles.imagePreview} />
                                    <TouchableOpacity
                                        style={styles.imageRemoveButton}
                                        onPress={() => handleRemoveImage(uri)}
                                    >
                                        <Text style={styles.imageRemoveText}>✕</Text>
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </ScrollView>
                    )}

                    <View style={styles.submitButtonWrapper}>
                        <Button
                            title={
                                isSubmitting
                                    ? (isEditMode ? '수정 중...' : '등록 중...')
                                    : (isEditMode ? '게시글 수정' : '게시글 등록')
                            }
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
    chipRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    chip: {
        paddingVertical: 8,
        paddingHorizontal: 14,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#d1d5db',
        backgroundColor: '#f9fafb',
    },
    chipActive: {
        backgroundColor: '#3b82f6',
        borderColor: '#3b82f6',
    },
    chipText: {
        fontSize: 13,
        color: '#374151',
        fontWeight: '500',
    },
    chipTextActive: {
        color: '#fff',
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
    imagePickerButton: {
        borderWidth: 1,
        borderColor: '#3b82f6',
        borderStyle: 'dashed',
        borderRadius: 8,
        padding: 14,
        alignItems: 'center',
        backgroundColor: '#eff6ff',
    },
    imagePickerText: {
        color: '#3b82f6',
        fontSize: 15,
        fontWeight: '600',
    },
    imagePreviewRow: {
        marginTop: 12,
    },
    imagePreviewItem: {
        position: 'relative',
        marginRight: 10,
    },
    imagePreview: {
        width: 90,
        height: 90,
        borderRadius: 8,
        backgroundColor: '#f3f4f6',
    },
    imageRemoveButton: {
        position: 'absolute',
        top: -6,
        right: -6,
        backgroundColor: '#ef4444',
        width: 22,
        height: 22,
        borderRadius: 11,
        alignItems: 'center',
        justifyContent: 'center',
    },
    imageRemoveText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: 'bold',
    },
    submitButtonWrapper: {
        marginTop: 32,
    },
});
