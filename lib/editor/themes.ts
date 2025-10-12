import type { Monaco } from '@monaco-editor/react';

// Convert HSL to Hex for Monaco
function hslToHex(h: number, s: number, l: number): string {
  s = s / 100;
  l = l / 100;
  
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  
  let r = 0, g = 0, b = 0;
  
  if (0 <= h && h < 60) {
    r = c; g = x; b = 0;
  } else if (60 <= h && h < 120) {
    r = x; g = c; b = 0;
  } else if (120 <= h && h < 180) {
    r = 0; g = c; b = x;
  } else if (180 <= h && h < 240) {
    r = 0; g = x; b = c;
  } else if (240 <= h && h < 300) {
    r = x; g = 0; b = c;
  } else if (300 <= h && h < 360) {
    r = c; g = 0; b = x;
  }
  
  r = Math.round((r + m) * 255);
  g = Math.round((g + m) * 255);
  b = Math.round((b + m) * 255);
  
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

// shadcn/ui colors converted to hex
const colors = {
  light: {
    background: hslToHex(0, 0, 100), // white
    foreground: hslToHex(222.2, 84, 4.9), // very dark blue
    card: hslToHex(0, 0, 100),
    cardForeground: hslToHex(222.2, 84, 4.9),
    popover: hslToHex(0, 0, 100),
    popoverForeground: hslToHex(222.2, 84, 4.9),
    primary: hslToHex(222.2, 47.4, 11.2),
    primaryForeground: hslToHex(210, 40, 98),
    secondary: hslToHex(210, 40, 96.1),
    secondaryForeground: hslToHex(222.2, 47.4, 11.2),
    muted: hslToHex(210, 40, 96.1),
    mutedForeground: hslToHex(215.4, 16.3, 46.9),
    accent: hslToHex(210, 40, 96.1),
    accentForeground: hslToHex(222.2, 47.4, 11.2),
    destructive: hslToHex(0, 84.2, 60.2),
    destructiveForeground: hslToHex(210, 40, 98),
    border: hslToHex(214.3, 31.8, 91.4),
    input: hslToHex(214.3, 31.8, 91.4),
    ring: hslToHex(222.2, 84, 4.9),
  },
  dark: {
    background: hslToHex(222.2, 84, 4.9), // very dark blue
    foreground: hslToHex(210, 40, 98), // light gray
    card: hslToHex(222.2, 84, 4.9),
    cardForeground: hslToHex(210, 40, 98),
    popover: hslToHex(222.2, 84, 4.9),
    popoverForeground: hslToHex(210, 40, 98),
    primary: hslToHex(210, 40, 98),
    primaryForeground: hslToHex(222.2, 47.4, 11.2),
    secondary: hslToHex(217.2, 32.6, 17.5),
    secondaryForeground: hslToHex(210, 40, 98),
    muted: hslToHex(217.2, 32.6, 17.5),
    mutedForeground: hslToHex(215, 20.2, 65.1),
    accent: hslToHex(217.2, 32.6, 17.5),
    accentForeground: hslToHex(210, 40, 98),
    destructive: hslToHex(0, 62.8, 30.6),
    destructiveForeground: hslToHex(210, 40, 98),
    border: hslToHex(217.2, 32.6, 17.5),
    input: hslToHex(217.2, 32.6, 17.5),
    ring: hslToHex(212.7, 26.8, 83.9),
  }
};

// Track if themes have been defined
let themesDefinedFlag = false;

export function defineMonacoThemes(monaco: Monaco) {
  // Only define themes once to avoid errors
  if (themesDefinedFlag) {
    return;
  }
  themesDefinedFlag = true;
  
  // Define light theme matching shadcn/ui
  monaco.editor.defineTheme('shadcn-light', {
    base: 'vs',
    inherit: true,
    rules: [
      { token: 'string.key.json', foreground: colors.light.primary },
      { token: 'string.value.json', foreground: colors.light.destructive },
      { token: 'number', foreground: colors.light.primary },
      { token: 'keyword', foreground: colors.light.primary },
      { token: 'comment', foreground: colors.light.mutedForeground, fontStyle: 'italic' },
    ],
    colors: {
      'editor.background': colors.light.background,
      'editor.foreground': colors.light.foreground,
      'editor.lineHighlightBackground': colors.light.secondary,
      'editor.selectionBackground': colors.light.accent,
      'editor.inactiveSelectionBackground': colors.light.muted,
      'editorLineNumber.foreground': colors.light.mutedForeground,
      'editorLineNumber.activeForeground': colors.light.foreground,
      'editorCursor.foreground': colors.light.primary,
      'editor.wordHighlightBackground': colors.light.accent,
      'editor.wordHighlightStrongBackground': colors.light.accent,
      'editorBracketMatch.background': colors.light.accent,
      'editorBracketMatch.border': colors.light.primary,
      'editorIndentGuide.background': colors.light.border,
      'editorIndentGuide.activeBackground': colors.light.mutedForeground,
      'editorRuler.foreground': colors.light.border,
      'editor.foldBackground': colors.light.accent,
      'editorOverviewRuler.border': colors.light.border,
      'editorError.foreground': colors.light.destructive,
      'editorWarning.foreground': colors.light.destructive,
      'editorGutter.background': colors.light.background,
      'editorGutter.modifiedBackground': colors.light.primary,
      'editorGutter.addedBackground': colors.light.primary,
      'editorGutter.deletedBackground': colors.light.destructive,
      'scrollbar.shadow': '#00000025',
      'scrollbarSlider.background': colors.light.mutedForeground + '33',
      'scrollbarSlider.hoverBackground': colors.light.mutedForeground + '66',
      'scrollbarSlider.activeBackground': colors.light.mutedForeground + '99',
    }
  });

  // Define dark theme matching shadcn/ui
  monaco.editor.defineTheme('shadcn-dark', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'string.key.json', foreground: colors.dark.primary },
      { token: 'string.value.json', foreground: '#f87171' }, // Light red for strings
      { token: 'number', foreground: '#60a5fa' }, // Light blue for numbers
      { token: 'keyword', foreground: colors.dark.primary },
      { token: 'comment', foreground: colors.dark.mutedForeground, fontStyle: 'italic' },
    ],
    colors: {
      'editor.background': colors.dark.background,
      'editor.foreground': colors.dark.foreground,
      'editor.lineHighlightBackground': colors.dark.secondary,
      'editor.selectionBackground': colors.dark.accent + 'aa',
      'editor.inactiveSelectionBackground': colors.dark.muted,
      'editorLineNumber.foreground': colors.dark.mutedForeground,
      'editorLineNumber.activeForeground': colors.dark.foreground,
      'editorCursor.foreground': colors.dark.primary,
      'editor.wordHighlightBackground': colors.dark.accent + '66',
      'editor.wordHighlightStrongBackground': colors.dark.accent + '99',
      'editorBracketMatch.background': colors.dark.accent,
      'editorBracketMatch.border': colors.dark.primary,
      'editorIndentGuide.background': colors.dark.border,
      'editorIndentGuide.activeBackground': colors.dark.mutedForeground,
      'editorRuler.foreground': colors.dark.border,
      'editor.foldBackground': colors.dark.accent + '33',
      'editorOverviewRuler.border': colors.dark.border,
      'editorError.foreground': '#ef4444',
      'editorWarning.foreground': '#f59e0b',
      'editorGutter.background': colors.dark.background,
      'editorGutter.modifiedBackground': '#60a5fa',
      'editorGutter.addedBackground': '#10b981',
      'editorGutter.deletedBackground': '#ef4444',
      'scrollbar.shadow': '#00000066',
      'scrollbarSlider.background': colors.dark.mutedForeground + '33',
      'scrollbarSlider.hoverBackground': colors.dark.mutedForeground + '66',
      'scrollbarSlider.activeBackground': colors.dark.mutedForeground + '99',
    }
  });
}