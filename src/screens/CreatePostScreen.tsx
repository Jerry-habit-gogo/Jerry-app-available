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
import { useHeaderHeight } from '@react-navigation/elements';
import { RootStackParamList } from '../navigation/RootNavigator';
import ScreenContainer from '../components/ScreenContainer';
import Button from '../components/Button';
import { createPost, updatePost, uploadPostImages } from '../services/boardService';
import { useUserStore } from '../store/userStore';
import { Post } from '../types';
import { color, radius, typography, shadow, inputHeight } from '../theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'CreatePost'>;

const REGION_OPTIONS = ['Sydney', 'Melbourne', 'Brisbane', 'Gold Coast'] as const;

const CATEGORY_LABELS: Record<Post['category'], string> = {
    jobs: '구인구직',
    real_estate: '부동산',
    marketplace: '중고장터',
    news: '뉴스',
    announcements: '공지사항',
};

const CATEGORY_ICONS: Record<Post['category'], string> = {
    jobs: '💼',
    real_estate: '🏠',
    marketplace: '🛍️',
    news: '📰',
    announcements: '📢',
};

export const CreatePostScreen: React.FC<Props> = ({ route, navigation }) => {
    const { user } = useUserStore();
    const headerHeight = useHeaderHeight();
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

        if (!region) {
            Alert.alert('알림', '지역을 선택해주세요.');
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
                region,
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
    const hasCategorySpecificField = category === 'jobs' || category === 'real_estate' || category === 'marketplace';

    return (
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? headerHeight : 0}
        >
            <ScreenContainer scrollable={true}>
                {/* ── 카테고리 ────────────────────────── */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>카테고리</Text>
                    {isEditMode ? (
                        <View style={styles.lockedField}>
                            <Text style={styles.lockedIcon}>{CATEGORY_ICONS[category as Post['category']]}</Text>
                            <View>
                                <Text style={styles.lockedFieldText}>{CATEGORY_LABELS[category as Post['category']]}</Text>
                                <Text style={styles.lockedFieldHint}>수정 시 카테고리는 변경할 수 없습니다</Text>
                            </View>
                        </View>
                    ) : (
                        <View style={styles.chipRow}>
                            {(['jobs', 'real_estate', 'marketplace', 'news', 'announcements'] as const).map((cat) => (
                                <TouchableOpacity
                                    key={cat}
                                    style={[styles.chip, category === cat && styles.chipActive]}
                                    onPress={() => setCategory(cat)}
                                >
                                    <Text style={styles.chipIcon}>{CATEGORY_ICONS[cat]}</Text>
                                    <Text style={[styles.chipText, category === cat && styles.chipTextActive]}>
                                        {CATEGORY_LABELS[cat]}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}
                </View>

                <View style={styles.divider} />

                {/* ── 기본 정보 ────────────────────────── */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>기본 정보</Text>

                    <Text style={styles.fieldLabel}>제목</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="제목을 입력하세요"
                        placeholderTextColor={color.text.placeholder}
                        value={title}
                        onChangeText={setTitle}
                        maxLength={100}
                    />

                    <Text style={styles.fieldLabel}>지역</Text>
                    <View style={styles.chipRow}>
                        {REGION_OPTIONS.map((option) => (
                            <TouchableOpacity
                                key={option}
                                style={[styles.chip, region === option && styles.chipActive]}
                                onPress={() => setRegion(option)}
                            >
                                <Text style={[styles.chipText, region === option && styles.chipTextActive]}>
                                    {option}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* ── 카테고리별 상세 정보 ─────────────── */}
                {hasCategorySpecificField && (
                    <>
                        <View style={styles.divider} />
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>
                                {category === 'jobs' && '구인 정보'}
                                {category === 'real_estate' && '매물 정보'}
                                {category === 'marketplace' && '상품 정보'}
                            </Text>

                            {/* 구인구직 — 고용형태 */}
                            {category === 'jobs' && (
                                <>
                                    <Text style={styles.fieldLabel}>고용형태</Text>
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

                            {/* 부동산 — 매물형태 */}
                            {category === 'real_estate' && (
                                <>
                                    <Text style={styles.fieldLabel}>매물형태</Text>
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

                            {/* 중고장터 — 상품상태 */}
                            {category === 'marketplace' && (
                                <>
                                    <Text style={styles.fieldLabel}>상품상태</Text>
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

                            {/* 가격 — 부동산 / 중고장터 공통 */}
                            {showPriceInput && (
                                <>
                                    <Text style={styles.fieldLabel}>가격 ($)</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="가격을 입력하세요 (숫자만)"
                                        placeholderTextColor={color.text.placeholder}
                                        value={price}
                                        onChangeText={setPrice}
                                        keyboardType="numeric"
                                    />
                                </>
                            )}
                        </View>
                    </>
                )}

                <View style={styles.divider} />

                {/* ── 본문 ─────────────────────────────── */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>본문 내용</Text>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        placeholder="본문 내용을 입력하세요"
                        placeholderTextColor={color.text.placeholder}
                        value={content}
                        onChangeText={setContent}
                        multiline
                        textAlignVertical="top"
                    />
                </View>

                <View style={styles.divider} />

                {/* ── 사진 ─────────────────────────────── */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>사진 <Text style={styles.sectionHint}>(선택 · 최대 5장)</Text></Text>
                    <TouchableOpacity
                        style={styles.imagePickerButton}
                        onPress={handlePickImages}
                        disabled={isPickingImage}
                    >
                        {isPickingImage ? (
                            <ActivityIndicator size="small" color={color.brand.green} />
                        ) : (
                            <>
                                <Text style={styles.imagePickerIcon}>🖼</Text>
                                <Text style={styles.imagePickerText}>
                                    {selectedImageUris.length > 0
                                        ? `${selectedImageUris.length}장 선택됨 — 변경하기`
                                        : '사진 추가하기'}
                                </Text>
                            </>
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
                </View>

                {/* ── 등록 버튼 ─────────────────────────── */}
                <View style={styles.submitButtonWrapper}>
                    <Button
                        title={
                            isSubmitting
                                ? (isEditMode ? '수정 중...' : '등록 중...')
                                : (isEditMode ? '수정 완료' : '게시글 등록')
                        }
                        onPress={handleSubmit}
                        isLoading={isSubmitting}
                    />
                </View>
            </ScreenContainer>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    section: {
        backgroundColor: color.bg.surface,
        paddingHorizontal: 16,
        paddingVertical: 20,
        ...shadow.soft,
    },
    divider: {
        height: 8,
        backgroundColor: color.bg.subtle,
    },
    sectionTitle: {
        fontSize: typography.size.bodySmall,
        fontWeight: typography.weight.bold,
        color: color.brand.greenDark,
        textTransform: 'uppercase',
        letterSpacing: 0.6,
        marginBottom: 16,
    },
    sectionHint: {
        fontSize: typography.size.caption,
        fontWeight: typography.weight.regular,
        color: color.text.tertiary,
        textTransform: 'none',
        letterSpacing: 0,
    },
    fieldLabel: {
        fontSize: typography.size.bodySmall,
        fontWeight: typography.weight.semiBold,
        color: color.text.secondary,
        marginBottom: 8,
        marginTop: 16,
    },
    chipRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 14,
        borderRadius: radius.full,
        borderWidth: 1,
        borderColor: color.line.default,
        backgroundColor: color.bg.subtle,
        gap: 4,
    },
    chipActive: {
        backgroundColor: color.brand.greenLight,
        borderColor: color.brand.green,
    },
    chipIcon: {
        fontSize: 13,
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
    lockedField: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        borderWidth: 1,
        borderColor: color.line.default,
        borderRadius: radius.md,
        paddingHorizontal: 16,
        paddingVertical: 14,
        backgroundColor: color.bg.subtle,
    },
    lockedIcon: {
        fontSize: 22,
    },
    lockedFieldText: {
        fontSize: typography.size.body,
        fontWeight: typography.weight.semiBold,
        color: color.text.primary,
        marginBottom: 2,
    },
    lockedFieldHint: {
        fontSize: typography.size.caption,
        color: color.text.tertiary,
    },
    input: {
        borderWidth: 1,
        borderColor: color.line.default,
        borderRadius: radius.md,
        paddingHorizontal: 16,
        paddingVertical: 0,
        minHeight: inputHeight.md,
        fontSize: typography.size.body,
        color: color.text.primary,
        backgroundColor: color.bg.surface,
        justifyContent: 'center',
    },
    textArea: {
        minHeight: 180,
        paddingVertical: 14,
    },
    imagePickerButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        borderWidth: 1.5,
        borderColor: color.brand.green,
        borderStyle: 'dashed',
        borderRadius: radius.md,
        paddingVertical: 16,
        backgroundColor: color.brand.greenLight,
    },
    imagePickerIcon: {
        fontSize: 18,
    },
    imagePickerText: {
        color: color.brand.greenDark,
        fontSize: typography.size.bodySmall,
        fontWeight: typography.weight.semiBold,
    },
    imagePreviewRow: {
        marginTop: 12,
    },
    imagePreviewItem: {
        position: 'relative',
        marginRight: 10,
    },
    imagePreview: {
        width: 88,
        height: 88,
        borderRadius: radius.sm,
        backgroundColor: color.bg.subtle,
    },
    imageRemoveButton: {
        position: 'absolute',
        top: -6,
        right: -6,
        backgroundColor: color.state.error,
        width: 22,
        height: 22,
        borderRadius: 11,
        alignItems: 'center',
        justifyContent: 'center',
    },
    imageRemoveText: {
        color: color.text.inverse,
        fontSize: typography.size.micro,
        fontWeight: typography.weight.bold,
    },
    submitButtonWrapper: {
        padding: 16,
        backgroundColor: color.bg.surface,
    },
});
