export const FontFamily = {
  regular: undefined,
  medium: undefined,
  semiBold: undefined,
  bold: undefined,
  extraBold: undefined,
};

export const FontSize = {
  xs: 11,
  sm: 12,
  base: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 28,
};

export const TextStyles = {
  h1: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.xxxl,
  },
  h2: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.xxl,
  },
  h3: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.xl,
  },
  h4: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.lg,
  },
  bodyLarge: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.md,
  },
  body: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.base,
  },
  bodySmall: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.sm,
  },
  caption: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.xs,
  },
};
