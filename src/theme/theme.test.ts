import { Colors, Spacing, Layout, BorderRadius, FontFamily, FontSize, TextStyles } from './index'; // Testing the barrel file

describe('Design System Tokens', () => {
  it('Colors should have exactly the expected keys', () => {
    const expectedKeys = [
      'primary',
      'secondary',
      'tertiary',
      'danger',
      'background',
      'surface',
      'textPrimary',
      'textSecondary',
      'textTertiary',
      'success',
      'warning',
    ];
    expect(Object.keys(Colors).sort()).toEqual(expectedKeys.sort());

    // Assert some specific values as per coding standards
    expect(Colors.primary).toBe('#0671ab');
    expect(Colors.danger).toBe('#d02a41');
  });

  it('Spacing and Layout should have expected keys', () => {
    const expectedSpacing = ['xs', 'sm', 'md', 'base', 'lg', 'xl', 'xxl', 'xxxl'];
    expect(Object.keys(Spacing).sort()).toEqual(expectedSpacing.sort());

    const expectedLayout = [
      'listItemHeight',
      'tabBarHeight',
      'headerHeight',
      'buttonHeight',
      'inputHeight',
    ];
    expect(Object.keys(Layout).sort()).toEqual(expectedLayout.sort());
  });

  it('BorderRadius should have expected keys', () => {
    const expectedRadius = ['xs', 'sm', 'md', 'lg', 'xl', 'full'];
    expect(Object.keys(BorderRadius).sort()).toEqual(expectedRadius.sort());
  });

  it('Typography (FontFamily & FontSize) should have expected keys', () => {
    const expectedFontFamily = ['regular', 'medium', 'semiBold', 'bold', 'extraBold'];
    expect(Object.keys(FontFamily).sort()).toEqual(expectedFontFamily.sort());

    const expectedFontSize = ['xs', 'sm', 'base', 'md', 'lg', 'xl', 'xxl', 'xxxl'];
    expect(Object.keys(FontSize).sort()).toEqual(expectedFontSize.sort());
  });

  it('TextStyles should use FontFamily and FontSize', () => {
    expect(TextStyles.body.fontFamily).toBe(FontFamily.regular);
    expect(TextStyles.body.fontSize).toBe(FontSize.base);
  });
});
