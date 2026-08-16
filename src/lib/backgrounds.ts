/**
 * Curated invitation backdrops. Pure CSS (no image assets) in the golden
 * hour palette. `css` is a CSS background shorthand value; `tone` says
 * whether page text outside the white cards should render light or dark.
 */

export interface InvitationBackground {
  label: string;
  tone: 'light' | 'dark';
  css: string;
}

export const BACKGROUNDS: Record<string, InvitationBackground> = {
  paper: { label: 'Paper', tone: 'light', css: '#FAF5EC' },
  shell: {
    label: 'Shell',
    tone: 'light',
    css: 'linear-gradient(180deg, #F7E7D3 0%, #FAF5EC 70%)',
  },
  linen: {
    label: 'Linen',
    tone: 'light',
    css: 'repeating-linear-gradient(0deg, #F4EDDF 0px, #F4EDDF 3px, #EEE4D0 3px, #EEE4D0 4px)',
  },
  'butter-stripe': {
    label: 'Butter stripe',
    tone: 'light',
    css: 'repeating-linear-gradient(90deg, #FAF5EC 0px, #FAF5EC 48px, #F6E8C8 48px, #F6E8C8 96px)',
  },
  sage: {
    label: 'Sage',
    tone: 'light',
    css: 'linear-gradient(160deg, #E9EEE4 0%, #D6E0CF 100%)',
  },
  confetti: {
    label: 'Confetti',
    tone: 'light',
    css: 'radial-gradient(#EBC98A 1.5px, transparent 1.5px) 0 0 / 26px 26px, radial-gradient(rgba(177,78,43,0.28) 1.5px, transparent 1.5px) 13px 13px / 26px 26px, #FAF5EC',
  },
  kraft: {
    label: 'Kraft',
    tone: 'light',
    css: 'linear-gradient(180deg, #E7D7BC 0%, #DCC9A6 100%)',
  },
  terracotta: {
    label: 'Terracotta',
    tone: 'dark',
    css: 'linear-gradient(170deg, #B14E2B 0%, #8F3D20 100%)',
  },
  dusk: {
    label: 'Dusk',
    tone: 'dark',
    css: 'linear-gradient(180deg, #53414C 0%, #302631 100%)',
  },
  celebration: {
    label: 'Celebration',
    tone: 'dark',
    css: 'radial-gradient(rgba(242,200,121,0.22) 1.5px, transparent 1.5px) 0 0 / 22px 22px, linear-gradient(180deg, #5B3A2E 0%, #3A2E25 100%)',
  },
};

export function backgroundOf(key: string | null | undefined): InvitationBackground | null {
  return key ? (BACKGROUNDS[key] ?? null) : null;
}
