/**
 * Jerry Design System Preview
 * 디자인 토큰 적용 전 확인용 화면 — 리뷰 후 삭제 가능
 */

import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { color, radius, shadow, spacing, typography } from '../theme/tokens';

// ─── 섹션 헤더 ────────────────────────────────────────────────────────────────
function PreviewSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={previewStyles.section}>
      <View style={previewStyles.sectionDivider} />
      <Text style={previewStyles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

// ─── 컬러 스와치 ──────────────────────────────────────────────────────────────
function Swatch({ hex, label }: { hex: string; label: string }) {
  const isDark = parseInt(hex.replace('#', ''), 16) < 0xaaaaaa * 0xaa;
  return (
    <View style={previewStyles.swatchWrap}>
      <View style={[previewStyles.swatch, { backgroundColor: hex }]}>
        <Text style={[previewStyles.swatchHex, { color: isDark ? '#fff' : '#333' }]}>{hex}</Text>
      </View>
      <Text style={previewStyles.swatchLabel}>{label}</Text>
    </View>
  );
}

// ─── 메인 ─────────────────────────────────────────────────────────────────────
export default function DesignPreviewScreen() {
  const [inputVal, setInputVal] = useState('');

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: color.bg.base }}
      contentContainerStyle={previewStyles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* ── 헤더 ── */}
      <View style={previewStyles.hero}>
        <Text style={previewStyles.heroLabel}>Jerry</Text>
        <Text style={previewStyles.heroTitle}>Design System</Text>
        <Text style={previewStyles.heroSub}>Organic Modernism · Premium · Calm</Text>
      </View>

      {/* ── 컬러 ── */}
      <PreviewSection title="Colors — Background">
        <View style={previewStyles.swatchRow}>
          <Swatch hex={color.bg.base} label="bg.base" />
          <Swatch hex={color.bg.surface} label="bg.surface" />
          <Swatch hex={color.bg.subtle} label="bg.subtle" />
        </View>
      </PreviewSection>

      <PreviewSection title="Colors — Text">
        <View style={previewStyles.swatchRow}>
          <Swatch hex={color.text.primary} label="text.primary" />
          <Swatch hex={color.text.secondary} label="text.secondary" />
          <Swatch hex={color.text.tertiary} label="text.tertiary" />
        </View>
      </PreviewSection>

      <PreviewSection title="Colors — Brand">
        <View style={previewStyles.swatchRow}>
          <Swatch hex={color.brand.green} label="brand.green" />
          <Swatch hex={color.brand.greenLight} label="green.light" />
          <Swatch hex={color.brand.blue} label="brand.blue" />
          <Swatch hex={color.brand.blueLight} label="blue.light" />
          <Swatch hex={color.brand.sand} label="brand.sand" />
          <Swatch hex={color.brand.sandLight} label="sand.light" />
        </View>
      </PreviewSection>

      <PreviewSection title="Colors — State">
        <View style={previewStyles.swatchRow}>
          <Swatch hex={color.state.success} label="success" />
          <Swatch hex={color.state.successLight} label="success.l" />
          <Swatch hex={color.state.warning} label="warning" />
          <Swatch hex={color.state.warningLight} label="warning.l" />
          <Swatch hex={color.state.error} label="error" />
          <Swatch hex={color.state.errorLight} label="error.l" />
        </View>
      </PreviewSection>

      {/* ── 타이포그래피 ── */}
      <PreviewSection title="Typography">
        <Text style={previewStyles.typoDisplay}>Display / 30 Bold</Text>
        <Text style={previewStyles.typoScreenTitle}>Screen Title / 24 Bold</Text>
        <Text style={previewStyles.typoSectionTitle}>Section Title / 18 Bold</Text>
        <Text style={previewStyles.typoBody}>
          Body / 15 Regular — Jerry는 "예쁜 앱"보다 "정돈된 서비스"처럼 보여야 한다.
        </Text>
        <Text style={previewStyles.typoBodySmall}>
          Body Small / 13 Regular — 보조 설명이나 메타 정보를 표시할 때 사용합니다.
        </Text>
        <Text style={previewStyles.typoCaption}>Caption · Meta / 12 Regular</Text>
        <View style={previewStyles.microBadge}>
          <Text style={previewStyles.typoMicro}>Micro 11 / Badge</Text>
        </View>
      </PreviewSection>

      {/* ── 버튼 ── */}
      <PreviewSection title="Buttons">
        {/* Primary */}
        <TouchableOpacity style={previewStyles.btnPrimary} activeOpacity={0.82}>
          <Text style={previewStyles.btnPrimaryText}>Primary Button</Text>
        </TouchableOpacity>

        {/* Primary — Blue */}
        <TouchableOpacity style={previewStyles.btnPrimaryBlue} activeOpacity={0.82}>
          <Text style={previewStyles.btnPrimaryText}>Primary Blue</Text>
        </TouchableOpacity>

        {/* Secondary */}
        <TouchableOpacity style={previewStyles.btnSecondary} activeOpacity={0.82}>
          <Text style={previewStyles.btnSecondaryText}>Secondary Button</Text>
        </TouchableOpacity>

        {/* Outline */}
        <TouchableOpacity style={previewStyles.btnOutline} activeOpacity={0.82}>
          <Text style={previewStyles.btnOutlineText}>Outline Button</Text>
        </TouchableOpacity>

        {/* Ghost */}
        <TouchableOpacity style={previewStyles.btnGhost} activeOpacity={0.82}>
          <Text style={previewStyles.btnGhostText}>Ghost / Text Button</Text>
        </TouchableOpacity>

        {/* Pill / Chip */}
        <View style={previewStyles.chipRow}>
          {['전체', '구인구직', '부동산', '중고장터'].map((label) => (
            <TouchableOpacity key={label} style={previewStyles.chip} activeOpacity={0.75}>
              <Text style={previewStyles.chipText}>{label}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={previewStyles.chipActive} activeOpacity={0.75}>
            <Text style={previewStyles.chipActiveText}>뉴스</Text>
          </TouchableOpacity>
        </View>
      </PreviewSection>

      {/* ── 입력창 ── */}
      <PreviewSection title="Input & Search">
        {/* 기본 입력창 */}
        <View style={previewStyles.inputWrap}>
          <TextInput
            value={inputVal}
            onChangeText={setInputVal}
            placeholder="입력창 — 물방울 감성 포인트"
            placeholderTextColor={color.text.placeholder}
            style={previewStyles.input}
          />
        </View>

        {/* 검색창 */}
        <View style={previewStyles.searchWrap}>
          <Text style={previewStyles.searchIcon}>🔍</Text>
          <TextInput
            placeholder="찾고 싶은 글이나 서비스를 검색하세요"
            placeholderTextColor={color.text.placeholder}
            style={previewStyles.searchInput}
          />
        </View>

        {/* 레이블 + 입력창 */}
        <View style={previewStyles.fieldWrap}>
          <Text style={previewStyles.fieldLabel}>제목</Text>
          <View style={previewStyles.inputWrap}>
            <TextInput
              placeholder="게시글 제목을 입력하세요"
              placeholderTextColor={color.text.placeholder}
              style={previewStyles.input}
            />
          </View>
        </View>
      </PreviewSection>

      {/* ── 카드 ── */}
      <PreviewSection title="Cards & Surfaces">
        {/* 기본 포스트 카드 */}
        <View style={previewStyles.postCard}>
          <View style={previewStyles.postCardHeader}>
            <View style={previewStyles.categoryBadge}>
              <Text style={previewStyles.categoryBadgeText}>구인구직</Text>
            </View>
            <Text style={previewStyles.postCardMeta}>Sydney · 2시간 전</Text>
          </View>
          <Text style={previewStyles.postCardTitle}>
            카페 바리스타 구인 — 시드니 CBD, 풀타임/파트타임
          </Text>
          <Text style={previewStyles.postCardBody} numberOfLines={2}>
            영어 가능자 우대, 경력 무관 지원 가능합니다. 근무 시간 협의 가능하며 페이는 어워드 레이트 기준입니다.
          </Text>
          <View style={previewStyles.postCardFooter}>
            <Text style={previewStyles.postCardFooterText}>조회 128 · 댓글 4 · 좋아요 12</Text>
          </View>
        </View>

        {/* 컴팩트 카드 (홈 가로 스크롤용) */}
        <View style={previewStyles.compactCard}>
          <View style={previewStyles.compactBadge}>
            <Text style={previewStyles.compactBadgeText}>부동산</Text>
          </View>
          <Text style={previewStyles.compactTitle} numberOfLines={2}>
            시드니 CBD 스튜디오 렌트 — 주 $420
          </Text>
          <Text style={previewStyles.compactMeta}>Haymarket · 어제</Text>
        </View>

        {/* 공지 행 */}
        <View style={previewStyles.announcementRow}>
          <View style={previewStyles.announcementDot} />
          <View style={{ flex: 1 }}>
            <Text style={previewStyles.announcementTitle} numberOfLines={1}>
              [공지] 서비스 점검 안내 — 3월 20일 새벽 2시
            </Text>
            <Text style={previewStyles.announcementMeta}>2025.03.18 · 운영팀</Text>
          </View>
        </View>

        {/* 인포 카드 (empty state / login prompt 등) */}
        <View style={previewStyles.infoCard}>
          <Text style={previewStyles.infoCardTitle}>로그인하고 이어보기 기능을 사용하세요</Text>
          <Text style={previewStyles.infoCardBody}>
            최근 본 글, 저장한 글, 맞춤 추천을 홈에서 바로 확인할 수 있습니다.
          </Text>
          <TouchableOpacity style={previewStyles.infoCardAction} activeOpacity={0.82}>
            <Text style={previewStyles.infoCardActionText}>로그인하기</Text>
          </TouchableOpacity>
        </View>
      </PreviewSection>

      {/* ── 배지 & 태그 ── */}
      <PreviewSection title="Badges & Tags">
        <View style={previewStyles.badgeRow}>
          <View style={[previewStyles.badge, { backgroundColor: color.brand.greenLight }]}>
            <Text style={[previewStyles.badgeText, { color: color.brand.greenDark }]}>구인구직</Text>
          </View>
          <View style={[previewStyles.badge, { backgroundColor: color.brand.blueLight }]}>
            <Text style={[previewStyles.badgeText, { color: color.brand.blueDark }]}>부동산</Text>
          </View>
          <View style={[previewStyles.badge, { backgroundColor: color.brand.sandLight }]}>
            <Text style={[previewStyles.badgeText, { color: color.brand.sandDark }]}>중고장터</Text>
          </View>
          <View style={[previewStyles.badge, { backgroundColor: color.state.successLight }]}>
            <Text style={[previewStyles.badgeText, { color: color.state.success }]}>판매중</Text>
          </View>
          <View style={[previewStyles.badge, { backgroundColor: color.state.errorLight }]}>
            <Text style={[previewStyles.badgeText, { color: color.state.error }]}>마감</Text>
          </View>
          <View style={[previewStyles.badge, { backgroundColor: color.state.warningLight }]}>
            <Text style={[previewStyles.badgeText, { color: color.state.warning }]}>예약중</Text>
          </View>
        </View>

        {/* 알림 카운트 배지 */}
        <View style={previewStyles.badgeRow}>
          <View style={previewStyles.countBadge}>
            <Text style={previewStyles.countBadgeText}>3</Text>
          </View>
          <View style={previewStyles.countBadge}>
            <Text style={previewStyles.countBadgeText}>9+</Text>
          </View>
        </View>
      </PreviewSection>

      {/* ── 홈 카테고리 카드 ── */}
      <PreviewSection title="Home — Category Cards">
        <View style={previewStyles.categoryGrid}>
          {[
            { label: 'Jobs', desc: '일자리와 채용 공고', icon: '💼', bg: color.brand.blueLight },
            { label: 'Real Estate', desc: '집, 방, 렌트 정보', icon: '🏠', bg: color.brand.greenLight },
            { label: 'Marketplace', desc: '중고 물품과 생활 거래', icon: '🛍️', bg: color.brand.sandLight },
            { label: 'News', desc: '지역 소식과 업데이트', icon: '📰', bg: '#F5F0FB' },
          ].map((item) => (
            <TouchableOpacity
              key={item.label}
              style={[previewStyles.categoryCard, { backgroundColor: item.bg }]}
              activeOpacity={0.82}
            >
              <Text style={previewStyles.categoryCardIcon}>{item.icon}</Text>
              <Text style={previewStyles.categoryCardLabel}>{item.label}</Text>
              <Text style={previewStyles.categoryCardDesc}>{item.desc}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </PreviewSection>

      {/* ── Border Radius ── */}
      <PreviewSection title="Border Radius Scale">
        <View style={previewStyles.radiusRow}>
          {([8, 12, 16, 20, 24] as const).map((r) => (
            <View key={r} style={[previewStyles.radiusBox, { borderRadius: r }]}>
              <Text style={previewStyles.radiusLabel}>{r}</Text>
            </View>
          ))}
        </View>
      </PreviewSection>

      {/* ── 그림자 ── */}
      <PreviewSection title="Shadow Scale">
        <View style={previewStyles.shadowRow}>
          <View style={[previewStyles.shadowBox, shadow.none]}>
            <Text style={previewStyles.shadowLabel}>none</Text>
          </View>
          <View style={[previewStyles.shadowBox, shadow.soft]}>
            <Text style={previewStyles.shadowLabel}>soft</Text>
          </View>
          <View style={[previewStyles.shadowBox, shadow.float]}>
            <Text style={previewStyles.shadowLabel}>float</Text>
          </View>
        </View>
      </PreviewSection>

      <View style={{ height: 60 }} />
    </ScrollView>
  );
}

// ─── 프리뷰 전용 스타일 ────────────────────────────────────────────────────────
const previewStyles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing[16],
    paddingTop: spacing[16],
  },

  // 섹션
  section: { marginBottom: spacing[32] },
  sectionDivider: {
    height: 1,
    backgroundColor: color.line.default,
    marginBottom: spacing[16],
  },
  sectionTitle: {
    fontSize: typography.size.caption,
    fontWeight: typography.weight.semiBold,
    color: color.text.tertiary,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: spacing[12],
  },

  // 히어로
  hero: {
    paddingVertical: spacing[32],
    alignItems: 'center',
    marginBottom: spacing[8],
  },
  heroLabel: {
    fontSize: typography.size.caption,
    fontWeight: typography.weight.semiBold,
    color: color.brand.green,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: spacing[8],
  },
  heroTitle: {
    fontSize: typography.size.display,
    fontWeight: typography.weight.bold,
    color: color.text.primary,
    marginBottom: spacing[8],
  },
  heroSub: {
    fontSize: typography.size.bodySmall,
    color: color.text.secondary,
  },

  // 스와치
  swatchRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  swatchWrap: { alignItems: 'center', width: 80 },
  swatch: {
    width: 80,
    height: 48,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    borderWidth: 1,
    borderColor: color.line.subtle,
  },
  swatchHex: { fontSize: 9, fontWeight: '600' },
  swatchLabel: { fontSize: 10, color: color.text.secondary, textAlign: 'center' },

  // 타이포
  typoDisplay: {
    fontSize: typography.size.display,
    fontWeight: typography.weight.bold,
    color: color.text.primary,
    marginBottom: spacing[8],
    lineHeight: typography.size.display * typography.lineHeight.tight,
  },
  typoScreenTitle: {
    fontSize: typography.size.screenTitle,
    fontWeight: typography.weight.bold,
    color: color.text.primary,
    marginBottom: spacing[8],
  },
  typoSectionTitle: {
    fontSize: typography.size.sectionTitle,
    fontWeight: typography.weight.bold,
    color: color.text.primary,
    marginBottom: spacing[8],
  },
  typoBody: {
    fontSize: typography.size.body,
    fontWeight: typography.weight.regular,
    color: color.text.primary,
    lineHeight: typography.size.body * typography.lineHeight.relaxed,
    marginBottom: spacing[8],
  },
  typoBodySmall: {
    fontSize: typography.size.bodySmall,
    color: color.text.secondary,
    lineHeight: typography.size.bodySmall * typography.lineHeight.relaxed,
    marginBottom: spacing[8],
  },
  typoCaption: {
    fontSize: typography.size.caption,
    color: color.text.tertiary,
    marginBottom: spacing[8],
  },
  microBadge: {
    alignSelf: 'flex-start',
    backgroundColor: color.brand.greenLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  typoMicro: {
    fontSize: typography.size.micro,
    fontWeight: typography.weight.semiBold,
    color: color.brand.greenDark,
  },

  // 버튼
  btnPrimary: {
    height: 48,
    borderRadius: radius.md,
    backgroundColor: color.brand.green,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[8],
  },
  btnPrimaryBlue: {
    height: 48,
    borderRadius: radius.md,
    backgroundColor: color.brand.blue,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[8],
  },
  btnPrimaryText: {
    fontSize: typography.size.body,
    fontWeight: typography.weight.semiBold,
    color: color.text.inverse,
  },
  btnSecondary: {
    height: 48,
    borderRadius: radius.md,
    backgroundColor: color.bg.subtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[8],
  },
  btnSecondaryText: {
    fontSize: typography.size.body,
    fontWeight: typography.weight.semiBold,
    color: color.text.primary,
  },
  btnOutline: {
    height: 48,
    borderRadius: radius.md,
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: color.brand.green,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[8],
  },
  btnOutlineText: {
    fontSize: typography.size.body,
    fontWeight: typography.weight.semiBold,
    color: color.brand.green,
  },
  btnGhost: {
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[8],
  },
  btnGhostText: {
    fontSize: typography.size.body,
    fontWeight: typography.weight.medium,
    color: color.brand.green,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: spacing[4],
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.md,
    backgroundColor: color.bg.subtle,
    borderWidth: 1,
    borderColor: color.line.default,
  },
  chipText: {
    fontSize: typography.size.bodySmall,
    fontWeight: typography.weight.medium,
    color: color.text.secondary,
  },
  chipActive: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.md,
    backgroundColor: color.brand.greenLight,
    borderWidth: 1,
    borderColor: color.brand.green,
  },
  chipActiveText: {
    fontSize: typography.size.bodySmall,
    fontWeight: typography.weight.semiBold,
    color: color.brand.greenDark,
  },

  // 입력창
  inputWrap: {
    backgroundColor: color.bg.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: color.line.default,
    paddingHorizontal: spacing[16],
    marginBottom: spacing[12],
  },
  input: {
    height: 52,
    fontSize: typography.size.body,
    color: color.text.primary,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: color.bg.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: color.line.default,
    paddingHorizontal: spacing[16],
    marginBottom: spacing[12],
  },
  searchIcon: { fontSize: 16, marginRight: 10 },
  searchInput: {
    flex: 1,
    height: 52,
    fontSize: typography.size.body,
    color: color.text.primary,
  },
  fieldWrap: { marginBottom: spacing[4] },
  fieldLabel: {
    fontSize: typography.size.bodySmall,
    fontWeight: typography.weight.semiBold,
    color: color.text.secondary,
    marginBottom: spacing[8],
  },

  // 카드
  postCard: {
    backgroundColor: color.bg.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: color.line.default,
    padding: spacing[16],
    marginBottom: spacing[12],
    ...shadow.soft,
  },
  postCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing[8],
  },
  categoryBadge: {
    backgroundColor: color.brand.greenLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  categoryBadgeText: {
    fontSize: typography.size.micro,
    fontWeight: typography.weight.semiBold,
    color: color.brand.greenDark,
  },
  postCardMeta: {
    fontSize: typography.size.caption,
    color: color.text.tertiary,
  },
  postCardTitle: {
    fontSize: typography.size.body,
    fontWeight: typography.weight.semiBold,
    color: color.text.primary,
    marginBottom: spacing[8],
    lineHeight: typography.size.body * typography.lineHeight.normal,
  },
  postCardBody: {
    fontSize: typography.size.bodySmall,
    color: color.text.secondary,
    lineHeight: typography.size.bodySmall * typography.lineHeight.relaxed,
    marginBottom: spacing[12],
  },
  postCardFooter: {
    paddingTop: spacing[12],
    borderTopWidth: 1,
    borderTopColor: color.line.subtle,
  },
  postCardFooterText: {
    fontSize: typography.size.caption,
    color: color.text.tertiary,
  },

  compactCard: {
    width: 180,
    backgroundColor: color.bg.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: color.line.default,
    padding: spacing[12],
    marginBottom: spacing[12],
    ...shadow.soft,
  },
  compactBadge: {
    backgroundColor: color.brand.blueLight,
    alignSelf: 'flex-start',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: radius.full,
    marginBottom: spacing[8],
  },
  compactBadgeText: {
    fontSize: typography.size.micro,
    fontWeight: typography.weight.semiBold,
    color: color.brand.blueDark,
  },
  compactTitle: {
    fontSize: typography.size.bodySmall,
    fontWeight: typography.weight.semiBold,
    color: color.text.primary,
    lineHeight: typography.size.bodySmall * typography.lineHeight.normal,
    marginBottom: spacing[4],
  },
  compactMeta: {
    fontSize: typography.size.caption,
    color: color.text.tertiary,
  },

  announcementRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: color.bg.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: color.line.default,
    padding: spacing[16],
    marginBottom: spacing[12],
    gap: 12,
  },
  announcementDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: color.brand.green,
    marginTop: 6,
  },
  announcementTitle: {
    fontSize: typography.size.body,
    fontWeight: typography.weight.semiBold,
    color: color.text.primary,
    marginBottom: 4,
  },
  announcementMeta: {
    fontSize: typography.size.caption,
    color: color.text.tertiary,
  },

  infoCard: {
    backgroundColor: color.bg.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: color.line.default,
    padding: spacing[20],
    marginBottom: spacing[12],
  },
  infoCardTitle: {
    fontSize: typography.size.body,
    fontWeight: typography.weight.semiBold,
    color: color.text.primary,
    marginBottom: spacing[8],
  },
  infoCardBody: {
    fontSize: typography.size.bodySmall,
    color: color.text.secondary,
    lineHeight: typography.size.bodySmall * typography.lineHeight.relaxed,
    marginBottom: spacing[16],
  },
  infoCardAction: {
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radius.md,
    backgroundColor: color.brand.green,
  },
  infoCardActionText: {
    fontSize: typography.size.bodySmall,
    fontWeight: typography.weight.semiBold,
    color: color.text.inverse,
  },

  // 배지
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: spacing[8] },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.full,
  },
  badgeText: {
    fontSize: typography.size.micro,
    fontWeight: typography.weight.semiBold,
  },
  countBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: color.state.error,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  countBadgeText: {
    fontSize: typography.size.micro,
    fontWeight: typography.weight.bold,
    color: '#fff',
  },

  // 카테고리 그리드
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  categoryCard: {
    width: '47%',
    borderRadius: radius.lg,
    padding: spacing[16],
    minHeight: 100,
  },
  categoryCardIcon: { fontSize: 24, marginBottom: spacing[8] },
  categoryCardLabel: {
    fontSize: typography.size.bodySmall,
    fontWeight: typography.weight.bold,
    color: color.text.primary,
    marginBottom: 4,
  },
  categoryCardDesc: {
    fontSize: typography.size.caption,
    color: color.text.secondary,
    lineHeight: 16,
  },

  // Radius
  radiusRow: { flexDirection: 'row', gap: 12, flexWrap: 'wrap' },
  radiusBox: {
    width: 56,
    height: 56,
    backgroundColor: color.brand.greenLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: color.brand.green,
  },
  radiusLabel: {
    fontSize: typography.size.micro,
    fontWeight: typography.weight.semiBold,
    color: color.brand.greenDark,
  },

  // Shadow
  shadowRow: { flexDirection: 'row', gap: 16 },
  shadowBox: {
    width: 80,
    height: 80,
    borderRadius: radius.lg,
    backgroundColor: color.bg.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: color.line.default,
  },
  shadowLabel: {
    fontSize: typography.size.caption,
    color: color.text.secondary,
  },
});
