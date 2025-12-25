wind.config.js
module.exports = {
    content: [
        './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
        './src/components/**/*.{js,ts,jsx,tsx,mdx}',
        './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            colors: {
                background: 'var(--background)',
                foreground: 'var(--foreground)',
                primary: 'var(--primary)',
                'primary-dark': 'var(--primary-dark)',
                secondary: 'var(--secondary)',
                'secondary-dark': 'var(--secondary-dark)',
                accent: 'var(--accent)',
                'text-primary': 'var(--text-primary)',
                'text-secondary': 'var(--text-secondary)',
                'text-tertiary': 'var(--text-tertiary)',
                border: 'var(--border)',
                error: 'var(--error)',
                success: 'var(--success)',
            },
        },
    },
    plugins: [],
}