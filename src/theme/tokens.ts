/**
 * Jerry Design System — Tokens
 * Concept: Organic Modernism
 * Mood: Premium · Calm · Minimal · Natural · Cozy
 *
 * DO NOT apply to existing screens until reviewed in preview.
 */

// ─── Color ────────────────────────────────────────────────────────────────────

export const color = {
  // Background
  bg: {
    base: '#F9F9F7',      // 전체 배경 (오프화이트)
    surface: '#FFFFFF',   // 카드, 모달 표면
    subtle: '#F3F5F4',    // 구분용 서브 배경
  },

  // Line / Divider
  line: {
    default: '#E7EBE8',   // 기본 구분선
    subtle: '#F0F2F1',    // 미세 구분선
  },

  // Text
  text: {
    primary: '#111827',   // 제목, 본문 강조
    secondary: '#5F6B66', // 부제, 보조 본문
    tertiary: '#98A29F',  // 메타, 캡션
    inverse: '#FFFFFF',   // 어두운 배경 위 텍스트
    placeholder: '#B8C4BF',
  },

  // Brand
  brand: {
    green: '#5F8F7B',     // 신뢰, 안정 — primary accent
    greenLight: '#EBF3EF',
    greenDark: '#3D6B58',
    blue: '#5B84B1',      // 정보, 명확함
    blueLight: '#EBF1F8',
    blueDark: '#3A6490',
    sand: '#D9C7A2',      // 따뜻한 보조 포인트
    sandLight: '#FAF4E8',
    sandDark: '#B8A07A',
  },

  // State
  state: {
    success: '#2F8F6B',
    successLight: '#E8F5F0',
    warning: '#C58A2B',
    warningLight: '#FDF5E6',
    error: '#D85C5C',
    errorLight: '#FBF0F0',
  },

  // Neutral (내부 UI 보조용)
  neutral: {
    50: '#F9FAF9',
    100: '#F3F5F4',
    200: '#E7EBE8',
    300: '#CDD5D1',
    400: '#B0BCB7',
    500: '#8F9D97',
    600: '#6E7D77',
    700: '#505E59',
    800: '#343F3C',
    900: '#1C2421',
  },
} as const;

// ─── Typography ───────────────────────────────────────────────────────────────

export const typography = {
  family: {
    base: 'Pretendard',   // 메인 폰트 (fallback: System)
    system: undefined,     // Platform.select로 처리
  },

  size: {
    display: 30,          // 히어로 타이틀
    screenTitle: 24,      // 화면 타이틀
    sectionTitle: 18,     // 섹션 헤더
    body: 15,             // 본문
    bodySmall: 13,        // 보조 본문
    caption: 12,          // 캡션, 메타
    micro: 11,            // 배지, 태그
  },

  weight: {
    regular: '400' as const,
    medium: '500' as const,
    semiBold: '600' as const,
    bold: '700' as const,
    extraBold: '800' as const,
  },

  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.6,
    loose: 1.75,
  },
} as const;

// ─── Spacing ──────────────────────────────────────────────────────────────────

export const spacing = {
  2: 2,
  4: 4,
  8: 8,
  12: 12,
  16: 16,
  20: 20,
  24: 24,
  32: 32,
  40: 40,
  48: 48,
  56: 56,
  64: 64,
} as const;

// ─── Border Radius ────────────────────────────────────────────────────────────

export const radius = {
  xs: 8,    // 소형 버튼, 태그 내부
  sm: 12,   // 작은 카드, 인풋 내부 요소
  md: 16,   // input / chip / small button ← 물방울 포인트
  lg: 20,   // card / modal / section surface
  xl: 24,   // hero panel / bottom sheet / major CTA
  full: 999, // 배지, pill 버튼
} as const;

// ─── Shadow ───────────────────────────────────────────────────────────────────

export const shadow = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  // 매우 약한 그림자 — 카드 위에서 살짝 떠있는 느낌
  soft: {
    shadowColor: '#1C2421',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  // 바텀시트, 모달 전용
  modal: {
    shadowColor: '#1C2421',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 8,
  },
  // Floating 버튼, 알림 배지
  float: {
    shadowColor: '#1C2421',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 12,
    elevation: 6,
  },
} as const;

// ─── Animation ────────────────────────────────────────────────────────────────

export const animation = {
  duration: {
    instant: 80,
    fast: 150,
    normal: 220,
    slow: 360,
  },
  // Reanimated spring config — 짧고 부드러운 탄성
  spring: {
    damping: 18,
    stiffness: 260,
    mass: 0.9,
  },
} as const;

// ─── Component Presets ────────────────────────────────────────────────────────

/** 버튼 높이 기준 */
export const buttonHeight = {
  sm: 36,
  md: 48,
  lg: 56,
} as const;

/** 입력창 높이 기준 */
export const inputHeight = {
  sm: 44,
  md: 52,
  lg: 58,
} as const;
