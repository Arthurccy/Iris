import type { Config } from 'tailwindcss';

export default {
	content: ['./src/**/*.{html,js,svelte,ts}'],
	theme: {
		extend: {
			colors: {
				corporate: {
					50: '#EEF3FF',
					100: '#DCE8FF',
					200: '#B6CEFF',
					300: '#7FA7FF',
					400: '#4677FF',
					500: '#1E4ED8',
					600: '#1E3A8A',
					700: '#172C69',
					800: '#111F4A',
					900: '#0D1738'
				},
				pearl: '#F3F4F6'
			},
			boxShadow: {
				glass: '0 10px 35px rgba(15, 23, 42, 0.08)'
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
