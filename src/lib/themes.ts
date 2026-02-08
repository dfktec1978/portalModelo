// ============================================
// CONFIGURAÇÃO DE TEMAS DO PORTAL MODELO
// ============================================

export type ThemeColor = 'azul' | 'verde' | 'preto-branco' | 'vermelho' | 'roxo' | 'laranja';

export interface ThemeConfig {
  id: ThemeColor;
  name: string;
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

export const PORTAL_THEMES: Record<ThemeColor, ThemeConfig> = {
  azul: {
    id: 'azul',
    name: 'Azul Oceano',
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
};

export function getTheme(themeId: ThemeColor): ThemeConfig {
  return PORTAL_THEMES[themeId] || PORTAL_THEMES.azul;
}

export function getThemesList(): ThemeConfig[] {
  return Object.values(PORTAL_THEMES);
}

export function applyThemeToStore(theme: ThemeConfig) {
  // Aplicar CSS variables no root do elemento da loja
  return {
    '--store-primary': theme.colors.primary,
    '--store-secondary': theme.colors.secondary,
    '--store-accent': theme.colors.accent,
    '--store-text': theme.colors.text,
    '--store-bg': theme.colors.background,
    '--store-card': theme.colors.card,
  } as React.CSSProperties;
}
