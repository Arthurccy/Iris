import type { Config } from 'tailwindcss';

export default {
	content: ['./src/**/*.{html,js,svelte,ts}'],
	theme: {
		extend: {
			colors: {
				corporate: {
					50: '#FBF4F5',
					100: '#F4E3E6',
					200: '#E7C6CD',
					300: '#D39DAA',
					400: '#B96A7B',
					500: '#9A3D4F',
					600: '#7B222E',
					700: '#5C1A22',
					800: '#451318',
					900: '#2F0B0F'
				},
				pearl: '#F3F4F6'
			},
			boxShadow: {
				glass: '0 10px 35px rgba(92, 26, 34, 0.08)'
			},
			backgroundImage: {
				grid: 'radial-gradient(circle at 1px 1px, rgba(148, 163, 184, 0.18) 1px, transparent 0)'
			},
			fontFamily: {
				sans: ['Segoe UI', 'Inter', 'system-ui', 'sans-serif']
			}
		}
	},
	plugins: []
} satisfies Config;
