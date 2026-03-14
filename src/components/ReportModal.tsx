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
            placeholderTextColor="#aaa"
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
                <ActivityIndicator size="small" color="#fff" />
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
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  reasonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 6,
    backgroundColor: '#F9FAFB',
  },
  reasonRowSelected: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#2563EB',
  },
  radio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    marginRight: 12,
  },
  radioSelected: {
    borderColor: '#2563EB',
    backgroundColor: '#2563EB',
  },
  reasonLabel: {
    fontSize: 15,
    color: '#374151',
  },
  reasonLabelSelected: {
    color: '#1D4ED8',
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: '#111',
    minHeight: 72,
    textAlignVertical: 'top',
    marginTop: 16,
    marginBottom: 20,
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6B7280',
  },
  submitButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: '#EF4444',
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
});
