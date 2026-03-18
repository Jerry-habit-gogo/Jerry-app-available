import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { ReportReason } from '../types';
import { reportContent } from '../services/moderationService';
import { color, radius, spacing, typography } from '../theme/tokens';

interface ReportModalProps {
  visible: boolean;
  targetType: 'post' | 'user' | 'comment';
  targetId: string;
  postId?: string;
  onClose: () => void;
}

const REASONS: { value: ReportReason; label: string }[] = [
  { value: 'spam', label: '스팸 / 도배' },
  { value: 'inappropriate', label: '부적절한 콘텐츠' },
  { value: 'scam', label: '사기 / 허위 정보' },
  { value: 'harassment', label: '혐오 / 괴롭힘' },
  { value: 'other', label: '기타' },
];

export const ReportModal: React.FC<ReportModalProps> = ({
  visible,
  targetType,
  targetId,
  postId,
  onClose,
}) => {
  const [reason, setReason] = useState<ReportReason>('spam');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await reportContent(targetType, targetId, reason, description, postId);
      Alert.alert('신고 접수', '신고가 접수되었습니다. 검토 후 조치하겠습니다.');
      setDescription('');
      setReason('spam');
      onClose();
    } catch {
      Alert.alert('오류', '신고 접수에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <Text style={styles.title}>신고하기</Text>
          <Text style={styles.subtitle}>신고 사유를 선택해주세요</Text>

          {REASONS.map((item) => (
            <TouchableOpacity
              key={item.value}
              style={[styles.reasonRow, reason === item.value && styles.reasonRowSelected]}
              onPress={() => setReason(item.value)}
              activeOpacity={0.7}
            >
              <View style={[styles.radio, reason === item.value && styles.radioSelected]} />
              <Text style={[styles.reasonLabel, reason === item.value && styles.reasonLabelSelected]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}

          <TextInput
            style={styles.input}
            placeholder="추가 설명 (선택사항)"
            placeholderTextColor={color.text.placeholder}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
            maxLength={300}
          />

          <View style={styles.buttons}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose} disabled={submitting}>
              <Text style={styles.cancelText}>취소</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator size="small" color={color.text.inverse} />
              ) : (
                <Text style={styles.submitText}>신고 접수</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: color.bg.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing[24],
    paddingBottom: 40,
  },
  title: {
    fontSize: typography.size.sectionTitle,
    fontWeight: typography.weight.bold,
    color: color.text.primary,
    marginBottom: spacing[4],
  },
  subtitle: {
    fontSize: typography.size.bodySmall,
    color: color.text.secondary,
    marginBottom: spacing[20],
  },
  reasonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing[12],
    paddingHorizontal: spacing[12],
    borderRadius: radius.sm,
    marginBottom: 6,
    backgroundColor: color.bg.subtle,
  },
  reasonRowSelected: {
    backgroundColor: color.brand.greenLight,
    borderWidth: 1,
    borderColor: color.brand.green,
  },
  radio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: color.line.default,
    marginRight: spacing[12],
  },
  radioSelected: {
    borderColor: color.brand.green,
    backgroundColor: color.brand.green,
  },
  reasonLabel: {
    fontSize: typography.size.body,
    color: color.text.secondary,
  },
  reasonLabelSelected: {
    color: color.brand.greenDark,
    fontWeight: typography.weight.semiBold,
  },
  input: {
    borderWidth: 1,
    borderColor: color.line.default,
    borderRadius: radius.sm,
    padding: spacing[12],
    fontSize: typography.size.bodySmall,
    color: color.text.primary,
    minHeight: 72,
    textAlignVertical: 'top',
    marginTop: spacing[16],
    marginBottom: spacing[20],
  },
  buttons: {
    flexDirection: 'row',
    gap: spacing[12],
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: color.line.default,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: typography.size.body,
    fontWeight: typography.weight.semiBold,
    color: color.text.tertiary,
  },
  submitButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: radius.sm,
    backgroundColor: color.state.error,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitText: {
    fontSize: typography.size.body,
    fontWeight: typography.weight.bold,
    color: color.text.inverse,
  },
});
