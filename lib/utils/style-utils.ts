'use client';

// Common styling patterns and utilities
export const COMMON_STYLES = {
  // Layout
  flexCenter: 'flex items-center justify-center',
  flexBetween: 'flex items-center justify-between',
  flexCol: 'flex flex-col',
  fullSize: 'h-full w-full',

  // Spacing
  gap2: 'gap-2',
  gap4: 'gap-4',
  p4: 'p-4',
  p6: 'p-6',
  px4: 'px-4',
  py2: 'py-2',
  mb2: 'mb-2',
  mb4: 'mb-4',

  // Text
  textSm: 'text-sm',
  textLg: 'text-lg',
  fontSemibold: 'font-semibold',
  fontMono: 'font-mono',
  textCenter: 'text-center',
  textMuted: 'text-muted-foreground',
  truncate: 'truncate',

  // Borders & Backgrounds
  border: 'border',
  borderB: 'border-b',
  rounded: 'rounded',
  roundedLg: 'rounded-lg',
  bgMuted: 'bg-muted',

  // Interactive states
  hoverBgMuted: 'hover:bg-muted/50',
  cursorPointer: 'cursor-pointer',

  // Common combinations
  cardPadding: 'p-6',
  buttonGap: 'gap-2',
  iconSm: 'h-4 w-4',
  iconMd: 'h-5 w-5',
  iconLg: 'h-16 w-16',

  // Status colors
  statusSuccess: 'text-green-600',
  statusError: 'text-destructive',
  statusInfo: 'text-blue-600',
  statusWarning: 'text-yellow-600',
} as const;

// Utility to combine common styles
export const combineStyles = (...styles: (keyof typeof COMMON_STYLES | string)[]) => {
  return styles
    .map((style) =>
      typeof style === 'string' && style in COMMON_STYLES
        ? COMMON_STYLES[style as keyof typeof COMMON_STYLES]
        : style
    )
    .join(' ');
};

// Common component style patterns
export const COMPONENT_STYLES = {
  // Cards
  card: {
    base: `${COMMON_STYLES.border} ${COMMON_STYLES.rounded} ${COMMON_STYLES.bgMuted}`,
    padded: `${COMMON_STYLES.border} ${COMMON_STYLES.rounded} ${COMMON_STYLES.cardPadding}`,
    centered: `${COMMON_STYLES.border} ${COMMON_STYLES.rounded} ${COMMON_STYLES.flexCenter} ${COMMON_STYLES.fullSize}`,
  },

  // Headers
  header: {
    base: `${COMMON_STYLES.flexBetween} ${COMMON_STYLES.mb4}`,
    title: `${COMMON_STYLES.textLg} ${COMMON_STYLES.fontSemibold}`,
    withIcon: `${COMMON_STYLES.flexCenter} ${COMMON_STYLES.gap2}`,
  },

  // Buttons
  button: {
    withIcon: `${COMMON_STYLES.gap2}`,
    group: `${COMMON_STYLES.flexCenter} ${COMMON_STYLES.gap2}`,
  },

  // Empty states
  emptyState: {
    container: `${COMMON_STYLES.fullSize} ${COMMON_STYLES.flexCenter}`,
    content: `${COMMON_STYLES.textCenter} ${COMMON_STYLES.textMuted}`,
    icon: `${COMMON_STYLES.iconLg} mx-auto ${COMMON_STYLES.mb4} opacity-50`,
    title: `${COMMON_STYLES.textLg} font-medium ${COMMON_STYLES.mb2}`,
  },

  // Status indicators
  status: {
    success: `${COMMON_STYLES.textSm} ${COMMON_STYLES.statusSuccess}`,
    error: `${COMMON_STYLES.textSm} ${COMMON_STYLES.statusError}`,
    info: `${COMMON_STYLES.textSm} ${COMMON_STYLES.statusInfo}`,
  },
} as const;

// Utility to get component styles
export const getComponentStyles = (component: keyof typeof COMPONENT_STYLES, variant: string) => {
  return COMPONENT_STYLES[component][variant as keyof (typeof COMPONENT_STYLES)[typeof component]];
};
