// ============================================
// CONFIGURAÇÃO DE TEMAS DO PORTAL MODELO
// ============================================

export type ThemeColor = 'azul' | 'verde' | 'preto-branco' | 'vermelho' | 'roxo' | 'laranja' | 'petroleo' | 'terracota';

export interface ThemeConfig {
  id: ThemeColor;
  name: string;
  description?: string;
  bestFor?: 'alimentacao' | 'varejo' | 'geral';
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    text: string;
    background: string;
    card: string;
  };
  preview: string; // Cor para preview visual
}

export interface ThemeSemanticTokens {
  buttonPrimaryBg: string;
  buttonPrimaryText: string;
  buttonPrimaryHover: string;
  buttonSecondaryBorder: string;
  buttonSecondaryText: string;
  buttonSecondaryHoverBg: string;
  badgeSuccessBg: string;
  badgeSuccessText: string;
  badgeWarningBg: string;
  badgeWarningText: string;
  borderSubtle: string;
  surfaceMuted: string;
}

export interface ThemeAccessibilityInfo {
  buttonPrimaryContrast: number;
  secondaryContrast: number;
  accentContrast: number;
  minContrast: number;
  grade: 'A' | 'B' | 'C';
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const safeHex = hex.replace('#', '').trim();
  const normalized = safeHex.length === 3
    ? safeHex.split('').map((c) => c + c).join('')
    : safeHex;

  const value = parseInt(normalized, 16);
  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
  };
}

function toRelativeLuminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  const channel = [r, g, b].map((channelValue) => {
    const normalized = channelValue / 255;
    return normalized <= 0.03928
      ? normalized / 12.92
      : Math.pow((normalized + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * channel[0] + 0.7152 * channel[1] + 0.0722 * channel[2];
}

export function getContrastRatio(backgroundHex: string, textHex: string): number {
  const lighter = Math.max(toRelativeLuminance(backgroundHex), toRelativeLuminance(textHex));
  const darker = Math.min(toRelativeLuminance(backgroundHex), toRelativeLuminance(textHex));
  return (lighter + 0.05) / (darker + 0.05);
}

export function getReadableTextColor(backgroundHex: string): string {
  const whiteContrast = getContrastRatio(backgroundHex, '#FFFFFF');
  const darkContrast = getContrastRatio(backgroundHex, '#1A1A1A');
  return whiteContrast >= darkContrast ? '#FFFFFF' : '#1A1A1A';
}

function shiftHexColor(hex: string, delta: number): string {
  const { r, g, b } = hexToRgb(hex);
  const clamp = (value: number) => Math.max(0, Math.min(255, value));
  const toHex = (value: number) => clamp(value).toString(16).padStart(2, '0');

  return `#${toHex(r + delta)}${toHex(g + delta)}${toHex(b + delta)}`;
}

export function getThemeSemanticTokens(theme: ThemeConfig): ThemeSemanticTokens {
  const primaryText = getReadableTextColor(theme.colors.primary);
  const secondaryText = getReadableTextColor(theme.colors.secondary);

  return {
    buttonPrimaryBg: theme.colors.primary,
    buttonPrimaryText: primaryText,
    buttonPrimaryHover: shiftHexColor(theme.colors.primary, -18),
    buttonSecondaryBorder: theme.colors.secondary,
    buttonSecondaryText: secondaryText,
    buttonSecondaryHoverBg: shiftHexColor(theme.colors.secondary, 104),
    badgeSuccessBg: '#DCFCE7',
    badgeSuccessText: '#166534',
    badgeWarningBg: '#FEF3C7',
    badgeWarningText: '#92400E',
    borderSubtle: shiftHexColor(theme.colors.primary, 156),
    surfaceMuted: theme.colors.card,
  };
}

export function getThemeAccessibility(theme: ThemeConfig): ThemeAccessibilityInfo {
  const primaryText = getReadableTextColor(theme.colors.primary);
  const secondaryText = getReadableTextColor(theme.colors.secondary);
  const accentText = getReadableTextColor(theme.colors.accent);

  const buttonPrimaryContrast = getContrastRatio(theme.colors.primary, primaryText);
  const secondaryContrast = getContrastRatio(theme.colors.secondary, secondaryText);
  const accentContrast = getContrastRatio(theme.colors.accent, accentText);
  const minContrast = Math.min(buttonPrimaryContrast, secondaryContrast, accentContrast);

  let grade: 'A' | 'B' | 'C' = 'C';
  if (minContrast >= 7) {
    grade = 'A';
  } else if (minContrast >= 4.5) {
    grade = 'B';
  }

  return {
    buttonPrimaryContrast,
    secondaryContrast,
    accentContrast,
    minContrast,
    grade,
  };
}

export const PORTAL_THEMES: Record<ThemeColor, ThemeConfig> = {
  azul: {
    id: 'azul',
    name: 'Azul Oceano',
    description: 'Visual confiável e versátil para qualquer segmento.',
    bestFor: 'geral',
    colors: {
      primary: '#003049',     // Azul escuro Portal Modelo
      secondary: '#0077B6',   // Azul médio
      accent: '#00B4D8',      // Azul claro
      text: '#1A1A1A',
      background: '#FFFFFF',
      card: '#F8F9FA',
    },
    preview: '#003049',
  },
  verde: {
    id: 'verde',
    name: 'Verde Natureza',
    description: 'Tom natural e acolhedor para operações locais.',
    bestFor: 'geral',
    colors: {
      primary: '#2D6A4F',     // Verde escuro
      secondary: '#40916C',   // Verde médio
      accent: '#52B788',      // Verde claro
      text: '#1A1A1A',
      background: '#FFFFFF',
      card: '#F1F8F4',
    },
    preview: '#2D6A4F',
  },
  'preto-branco': {
    id: 'preto-branco',
    name: 'Preto & Branco',
    description: 'Estética premium com alta sobriedade para varejo.',
    bestFor: 'varejo',
    colors: {
      primary: '#1A1A1A',     // Preto
      secondary: '#4A4A4A',   // Cinza escuro
      accent: '#808080',      // Cinza médio
      text: '#1A1A1A',
      background: '#FFFFFF',
      card: '#F5F5F5',
    },
    preview: '#1A1A1A',
  },
  vermelho: {
    id: 'vermelho',
    name: 'Vermelho Energia',
    description: 'Acelera atenção para campanhas e promoções.',
    bestFor: 'alimentacao',
    colors: {
      primary: '#D62828',     // Vermelho Portal Modelo
      secondary: '#F77F00',   // Laranja avermelhado
      accent: '#FCBF49',      // Amarelo quente
      text: '#1A1A1A',
      background: '#FFFFFF',
      card: '#FFF5F5',
    },
    preview: '#D62828',
  },
  roxo: {
    id: 'roxo',
    name: 'Roxo Elegante',
    description: 'Marca autoral com identidade forte.',
    bestFor: 'geral',
    colors: {
      primary: '#5A189A',     // Roxo escuro
      secondary: '#7209B7',   // Roxo médio
      accent: '#9D4EDD',      // Roxo claro
      text: '#1A1A1A',
      background: '#FFFFFF',
      card: '#F8F5FB',
    },
    preview: '#5A189A',
  },
  laranja: {
    id: 'laranja',
    name: 'Laranja Vibrante',
    description: 'Apetitoso e dinâmico para cardápios.',
    bestFor: 'alimentacao',
    colors: {
      primary: '#E85D04',     // Laranja escuro
      secondary: '#F48C06',   // Laranja médio
      accent: '#FDC500',      // Amarelo Portal Modelo
      text: '#1A1A1A',
      background: '#FFFFFF',
      card: '#FFF8F0',
    },
    preview: '#E85D04',
  },
  petroleo: {
    id: 'petroleo',
    name: 'Petróleo Urbano',
    description: 'Tom sofisticado com boa leitura em fundos claros.',
    bestFor: 'varejo',
    colors: {
      primary: '#0A3A40',
      secondary: '#146C78',
      accent: '#3AA6B1',
      text: '#1A1A1A',
      background: '#FFFFFF',
      card: '#F2FAFB',
    },
    preview: '#0A3A40',
  },
  terracota: {
    id: 'terracota',
    name: 'Terracota Mercado',
    description: 'Quente e convidativo para marcas gastronômicas.',
    bestFor: 'alimentacao',
    colors: {
      primary: '#9C3D2D',
      secondary: '#C85A38',
      accent: '#E29A5E',
      text: '#1A1A1A',
      background: '#FFFFFF',
      card: '#FFF7F2',
    },
    preview: '#9C3D2D',
  },
};

export function getTheme(themeId: ThemeColor): ThemeConfig {
  return PORTAL_THEMES[themeId] || PORTAL_THEMES.azul;
}

export function getThemesList(): ThemeConfig[] {
  return Object.values(PORTAL_THEMES);
}

export function applyThemeToStore(theme: ThemeConfig) {
  const semantic = getThemeSemanticTokens(theme);
  const accessiblePrimaryText = getReadableTextColor(theme.colors.primary);

  // Aplicar CSS variables no root do elemento da loja
  return {
    '--store-primary': theme.colors.primary,
    '--store-primary-contrast': accessiblePrimaryText,
    '--store-secondary': theme.colors.secondary,
    '--store-accent': theme.colors.accent,
    '--store-text': theme.colors.text,
    '--store-bg': theme.colors.background,
    '--store-card': theme.colors.card,
    '--store-button-primary-bg': semantic.buttonPrimaryBg,
    '--store-button-primary-text': semantic.buttonPrimaryText,
    '--store-button-primary-hover': semantic.buttonPrimaryHover,
    '--store-button-secondary-border': semantic.buttonSecondaryBorder,
    '--store-button-secondary-text': semantic.buttonSecondaryText,
    '--store-button-secondary-hover-bg': semantic.buttonSecondaryHoverBg,
    '--store-border-subtle': semantic.borderSubtle,
    '--store-surface-muted': semantic.surfaceMuted,
  } as React.CSSProperties;
}
