/** @type {import('tailwindcss').Config} */
export default {
	content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
	theme: {
		extend: {
			colors: {
				// WhatsApp-inspired light color palette
				primary: {
					50: '#f0fdf4',
					100: '#dcfce7',
					200: '#bbf7d0',
					300: '#86efac',
					400: '#4ade80',
					500: '#25d366', // WhatsApp green
					600: '#16a34a',
					700: '#15803d',
					800: '#166534',
					900: '#14532d',
				},
				'primary-green': {
					DEFAULT: '#25d366',
					dark: '#128c7e',
					light: '#dcf8c6',
				},
				background: {
					DEFAULT: '#f0f2f5', // Light background
					light: '#ffffff', // Pure white
					dark: '#128C7E', // Light beige gradient
					secondary: '#f7f8fa', // Secondary light
					tertiary: '#b7e68e', // Tertiary light
					chat: '#b7e68e', // Chat background (WhatsApp light beige)
					message: '#dcf8c6', // Sent message bubble (light green)
					received: '#ffffff', // Received message (white)
					hover: '#b7e68e', // Hover state
				},
				text: {
					primary: '#111b21', // Primary text (dark)
					secondary: '#667781', // Secondary text (gray)
					muted: '#8696a0', // Muted text (light gray)
					accent: '#00a884', // Accent text (green)
					light: '#54656f', // Light text
				},
				border: {
					DEFAULT: '#e9edef', // Default border (light gray)
					light: '#f0f2f5', // Light border
					dark: '#d1d7db', // Darker border
					accent: '#00a884', // Accent border (green)
				},
				icon: {
					primary: '#54656f', // Primary icon (dark gray)
					secondary: '#8696a0', // Secondary icon (light gray)
					accent: '#00a884', // Accent icon (green)
					muted: '#aebac1', // Muted icon
				},
				status: {
					online: '#25d366',
					offline: '#8696a0',
					away: '#ffb02e',
				},
			},
			fontFamily: {
				sans: ['Segoe UI', 'Helvetica Neue', 'Helvetica', 'Lucida Grande', 'Arial', 'Ubuntu', 'Cantarell', 'Fira Sans', 'sans-serif'],
			},
			spacing: {
				'18': '4.5rem',
				'88': '22rem',
			},
			borderRadius: {
				'xl': '0.75rem',
				'2xl': '1rem',
				'3xl': '1.5rem',
			},
			boxShadow: {
				'whatsapp': '0 2px 5px 0 rgba(0, 0, 0, 0.1), 0 2px 10px 0 rgba(0, 0, 0, 0.06)',
				'message': '0 1px 0.5px rgba(0, 0, 0, 0.13)',
				'light': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
				'fab': '0 4px 12px rgba(37, 211, 102, 0.3)',
			},
		},
	},
	plugins: [],
};
