// emails/styles.js

// Color palette
export const colors = {
    primary: '#000000',
    primaryLight: '#FDBA74',
    background: '#f6f9fc',
    white: '#ffffff',
    gray900: '#1f2937',
    gray700: '#374151',
    gray500: '#6B7280',
    grayLight: '#F9FAFB',
    orange50: '#FFF7ED',
};

// Typography
export const typography = {
    fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
    sizes: {
        heading: '28px',
        subheading: '18px',
        body: '16px',
        small: '14px',
    },
    weights: {
        normal: '400',
        medium: '600',
        bold: 'bold',
    },
    lineHeights: {
        tight: '20px',
        normal: '24px',
        relaxed: '26px',
    },
};

// Spacing
export const spacing = {
    xs: '8px',
    sm: '16px',
    md: '20px',
    lg: '32px',
    xl: '48px',
    xxl: '64px',
};

// Email styles object
export const emailStyles = {
    // Layout
    main: {
        backgroundColor: colors.background,
        fontFamily: typography.fontFamily,
    },

    container: {
        backgroundColor: colors.white,
        margin: '0 auto',
        padding: `${spacing.md} 0 ${spacing.xl}`,
        marginBottom: spacing.xxl,
        maxWidth: '580px',
    },

    // Logo section
    logoSection: {
        padding: `${spacing.lg} ${spacing.md}`,
        textAlign: 'center',
    },

    logo: {
        margin: '0 auto',
    },

    // Typography
    heading: {
        fontSize: typography.sizes.heading,
        fontWeight: typography.weights.bold,
        color: colors.gray900,
        textAlign: 'center',
        margin: `0 0 30px`,
        padding: `0 ${spacing.md}`,
    },

    paragraph: {
        fontSize: typography.sizes.body,
        lineHeight: typography.lineHeights.relaxed,
        color: colors.gray700,
        padding: `0 ${spacing.md}`,
        margin: `0 0 ${spacing.md}`,
    },

    // Features section
    featuresSection: {
        maxWidth: '100%',
        backgroundColor: colors.orange50,
        borderRadius: '8px',
        margin: `24px 0`,
        padding: spacing.md,
        border: `1px solid ${colors.primaryLight}`,
    },

    featuresTitle: {
        fontSize: typography.sizes.subheading,
        fontWeight: typography.weights.medium,
        color: colors.gray900,
        margin: `0 0 ${spacing.sm}`,
    },

    featureText: {
        fontSize: typography.sizes.body,
        lineHeight: typography.lineHeights.normal,
        color: colors.gray700,
        margin: '0',
    },

    // Button
    buttonSection: {
        textAlign: 'center',
        margin: `${spacing.lg} 0`,
        padding: `0 ${spacing.md}`,
    },

    button: {
        backgroundColor: colors.primary,
        borderRadius: '8px',
        color: colors.white,
        fontSize: typography.sizes.body,
        fontWeight: typography.weights.medium,
        textDecoration: 'none',
        textAlign: 'center',
        display: 'inline-block',
        padding: `14px ${spacing.lg}`,
        border: 'none',
        cursor: 'pointer',
    },

    // Footer
    footer: {
        padding: `0 ${spacing.md}`,
        margin: `${spacing.lg} 0 0`,
    },

    footerText: {
        fontSize: typography.sizes.body,
        lineHeight: typography.lineHeights.normal,
        color: colors.gray700,
        margin: '0',
    },

    // Support section
    supportSection: {
        backgroundColor: colors.grayLight,
        padding: spacing.md,
        margin: `${spacing.lg} ${spacing.md} 0`,
        borderRadius: '8px',
        textAlign: 'center',
    },

    supportText: {
        fontSize: typography.sizes.small,
        lineHeight: typography.lineHeights.tight,
        color: colors.gray500,
        margin: '0',
    },

    link: {
        color: colors.primary,
        textDecoration: 'underline',
    },

    // Order confirmation specific styles
    dividerSection: {
        textAlign: 'center',
        margin: '20px 0',
        padding: `0 ${spacing.md}`,
    },

    divider: {
        fontSize: typography.sizes.subheading,
        color: colors.gray500,
        letterSpacing: '2px',
        fontWeight: typography.weights.normal,
    },

    orderDetailItem: {
        fontSize: typography.sizes.body,
        lineHeight: typography.lineHeights.normal,
        color: colors.gray700,
        margin: `0 0 12px`,
    },

    productsSection: {
        marginTop: spacing.sm,
    },

    productsSectionTitle: {
        fontSize: typography.sizes.body,
        color: colors.gray700,
        marginBottom: spacing.xs,
    },

    shippingSection: {
        padding: `0 ${spacing.md}`,
        margin: `${spacing.md} 0`,
    },

    questionSection: {
        padding: `0 ${spacing.md}`,
        margin: `${spacing.md} 0`,
    },
};

// Utility functions for creating custom styles
export const createButtonStyle = (backgroundColor = colors.primary, textColor = colors.white) => ({
    ...emailStyles.button,
    backgroundColor,
    color: textColor,
});

export const createSectionStyle = (backgroundColor = colors.white, padding = spacing.md) => ({
    backgroundColor,
    padding,
    borderRadius: '8px',
    margin: `24px ${spacing.md}`,
});

// Theme variations
export const themes = {
    orange: {
        primary: '#FF6B35',
        primaryLight: '#FDBA74',
        accent: '#FFF7ED',
    },
    blue: {
        primary: '#4F46E5',
        primaryLight: '#A5B4FC',
        accent: '#EEF2FF',
    },
    green: {
        primary: '#059669',
        primaryLight: '#86EFAC',
        accent: '#ECFDF5',
    },
    purple: {
        primary: '#7C3AED',
        primaryLight: '#C4B5FD',
        accent: '#F3F4F6',
    },
};

// Function to generate theme-based styles
export const createThemedStyles = (theme = 'orange') => {
    const selectedTheme = themes[theme];
    return {
        ...emailStyles,
        button: {
            ...emailStyles.button,
            backgroundColor: selectedTheme.primary,
        },
        link: {
            ...emailStyles.link,
            color: selectedTheme.primary,
        },
        featuresSection: {
            ...emailStyles.featuresSection,
            backgroundColor: selectedTheme.accent,
            border: `1px solid ${selectedTheme.primaryLight}`,
        },
    };
};
