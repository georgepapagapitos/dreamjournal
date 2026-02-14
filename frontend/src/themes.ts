export interface Theme {
    id: string
    name: string
    description: string
    colors: {
        ink: string
        inkRgb: string
        inkSoft: string
        inkSoftRgb: string
        inkMuted: string
        inkMutedRgb: string
        parchment: string
        parchmentRgb: string
        parchment2: string
        parchment2Rgb: string
        parchment3: string
        parchment3Rgb: string
        accent: string
        accentRgb: string
        accentDeep: string
        accentDeepRgb: string
        accentGlow: string
        accentGlowRgb: string
        cream: string
        creamRgb: string
        gold: string
        goldRgb: string
        goldLight: string
        goldLightRgb: string
    }
}

export const themes: Theme[] = [
    {
        id: 'amber',
        name: 'Amber Dream',
        description: 'Warm amber & cream (default)',
        colors: {
            ink: '#1a0f08',
            inkRgb: '26, 15, 8',
            inkSoft: '#3d2314',
            inkSoftRgb: '61, 35, 20',
            inkMuted: '#7a5c47',
            inkMutedRgb: '122, 92, 71',
            parchment: '#f5ede0',
            parchmentRgb: '245, 237, 224',
            parchment2: '#ede0cc',
            parchment2Rgb: '237, 224, 204',
            parchment3: '#e3d0b5',
            parchment3Rgb: '227, 208, 181',
            accent: '#c4824a',
            accentRgb: '196, 130, 74',
            accentDeep: '#a06030',
            accentDeepRgb: '160, 96, 48',
            accentGlow: '#e8a96e',
            accentGlowRgb: '232, 169, 110',
            cream: '#faf5ed',
            creamRgb: '250, 245, 237',
            gold: '#d4a853',
            goldRgb: '212, 168, 83',
            goldLight: '#f0cc7a',
            goldLightRgb: '240, 204, 122',
        },
    },
    {
        id: 'twilight',
        name: 'Twilight Purple',
        description: 'Mystical deep purple & lavender',
        colors: {
            ink: '#0f0a1f',
            inkRgb: '15, 10, 31',
            inkSoft: '#1a0f3d',
            inkSoftRgb: '26, 15, 61',
            inkMuted: '#5a4d7a',
            inkMutedRgb: '90, 77, 122',
            parchment: '#e8e4f0',
            parchmentRgb: '232, 228, 240',
            parchment2: '#d4cfe3',
            parchment2Rgb: '212, 207, 227',
            parchment3: '#c0b8d4',
            parchment3Rgb: '192, 184, 212',
            accent: '#7c5ce6',
            accentRgb: '124, 92, 230',
            accentDeep: '#5a3db8',
            accentDeepRgb: '90, 61, 184',
            accentGlow: '#9d80f0',
            accentGlowRgb: '157, 128, 240',
            cream: '#f0ecf8',
            creamRgb: '240, 236, 248',
            gold: '#a88ce6',
            goldRgb: '168, 140, 230',
            goldLight: '#c4b0f0',
            goldLightRgb: '196, 176, 240',
        },
    },
    {
        id: 'midnight',
        name: 'Midnight Blue',
        description: 'Calm oceanic blues',
        colors: {
            ink: '#0a0f1a',
            inkRgb: '10, 15, 26',
            inkSoft: '#152238',
            inkSoftRgb: '21, 34, 56',
            inkMuted: '#47597a',
            inkMutedRgb: '71, 89, 122',
            parchment: '#e4e9f0',
            parchmentRgb: '228, 233, 240',
            parchment2: '#cfd9e3',
            parchment2Rgb: '207, 217, 227',
            parchment3: '#b8c8d4',
            parchment3Rgb: '184, 200, 212',
            accent: '#5c8ce6',
            accentRgb: '92, 140, 230',
            accentDeep: '#3d6bb8',
            accentDeepRgb: '61, 107, 184',
            accentGlow: '#80a8f0',
            accentGlowRgb: '128, 168, 240',
            cream: '#ecf2f8',
            creamRgb: '236, 242, 248',
            gold: '#6c9ce6',
            goldRgb: '108, 156, 230',
            goldLight: '#8cb0f0',
            goldLightRgb: '140, 176, 240',
        },
    },
    {
        id: 'forest',
        name: 'Forest Emerald',
        description: 'Deep forest greens',
        colors: {
            ink: '#0a1a0f',
            inkRgb: '10, 26, 15',
            inkSoft: '#15382d',
            inkSoftRgb: '21, 56, 45',
            inkMuted: '#47756a',
            inkMutedRgb: '71, 117, 106',
            parchment: '#e4f0eb',
            parchmentRgb: '228, 240, 235',
            parchment2: '#cfe8dc',
            parchment2Rgb: '207, 232, 220',
            parchment3: '#b8d8cc',
            parchment3Rgb: '184, 216, 204',
            accent: '#5ce6b4',
            accentRgb: '92, 230, 180',
            accentDeep: '#3db88f',
            accentDeepRgb: '61, 184, 143',
            accentGlow: '#80f0c8',
            accentGlowRgb: '128, 240, 200',
            cream: '#ecf8f3',
            creamRgb: '236, 248, 243',
            gold: '#6ce6be',
            goldRgb: '108, 230, 190',
            goldLight: '#8cf0d0',
            goldLightRgb: '140, 240, 208',
        },
    },
    {
        id: 'rose',
        name: 'Rose Garden',
        description: 'Soft rose & peach tones',
        colors: {
            ink: '#1a0f14',
            inkRgb: '26, 15, 20',
            inkSoft: '#3d2230',
            inkSoftRgb: '61, 34, 48',
            inkMuted: '#7a5465',
            inkMutedRgb: '122, 84, 101',
            parchment: '#f0e4e8',
            parchmentRgb: '240, 228, 232',
            parchment2: '#e8cfd9',
            parchment2Rgb: '232, 207, 217',
            parchment3: '#d8b8c8',
            parchment3Rgb: '216, 184, 200',
            accent: '#e65c8c',
            accentRgb: '230, 92, 140',
            accentDeep: '#b83d6b',
            accentDeepRgb: '184, 61, 107',
            accentGlow: '#f080a8',
            accentGlowRgb: '240, 128, 168',
            cream: '#f8ecf0',
            creamRgb: '248, 236, 240',
            gold: '#e66c9c',
            goldRgb: '230, 108, 156',
            goldLight: '#f08cb0',
            goldLightRgb: '240, 140, 176',
        },
    },
]

export function applyTheme(theme: Theme) {
    const root = document.documentElement

    // Apply hex colors
    root.style.setProperty('--ink', theme.colors.ink)
    root.style.setProperty('--ink-soft', theme.colors.inkSoft)
    root.style.setProperty('--ink-muted', theme.colors.inkMuted)
    root.style.setProperty('--parchment', theme.colors.parchment)
    root.style.setProperty('--parchment2', theme.colors.parchment2)
    root.style.setProperty('--parchment3', theme.colors.parchment3)
    root.style.setProperty('--amber', theme.colors.accent)
    root.style.setProperty('--amber-deep', theme.colors.accentDeep)
    root.style.setProperty('--amber-glow', theme.colors.accentGlow)
    root.style.setProperty('--cream', theme.colors.cream)
    root.style.setProperty('--gold', theme.colors.gold)
    root.style.setProperty('--gold-light', theme.colors.goldLight)

    // Apply RGB values for use with rgba()
    root.style.setProperty('--ink-rgb', theme.colors.inkRgb)
    root.style.setProperty('--ink-soft-rgb', theme.colors.inkSoftRgb)
    root.style.setProperty('--ink-muted-rgb', theme.colors.inkMutedRgb)
    root.style.setProperty('--parchment-rgb', theme.colors.parchmentRgb)
    root.style.setProperty('--parchment2-rgb', theme.colors.parchment2Rgb)
    root.style.setProperty('--parchment3-rgb', theme.colors.parchment3Rgb)
    root.style.setProperty('--amber-rgb', theme.colors.accentRgb)
    root.style.setProperty('--amber-deep-rgb', theme.colors.accentDeepRgb)
    root.style.setProperty('--amber-glow-rgb', theme.colors.accentGlowRgb)
    root.style.setProperty('--cream-rgb', theme.colors.creamRgb)
    root.style.setProperty('--gold-rgb', theme.colors.goldRgb)
    root.style.setProperty('--gold-light-rgb', theme.colors.goldLightRgb)
}

export function getThemeById(id: string): Theme {
    return themes.find(t => t.id === id) || themes[0]
}