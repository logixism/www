import {
  argbFromHex,
  DynamicScheme,
  Hct,
  hexFromArgb,
  MaterialDynamicColors,
  themeFromSourceColor,
  Variant,
} from "@material/material-color-utilities";

export type ThemeBackgrounds = {
  light: string;
  dark: string;
};

export function getThemeBackgrounds(source: string): ThemeBackgrounds {
  const sourceArgb = argbFromHex(source);
  const theme = themeFromSourceColor(sourceArgb);
  const colors = new MaterialDynamicColors();

  const background = (isDark: boolean): string => {
    const scheme = new DynamicScheme({
      sourceColorHct: Hct.fromInt(sourceArgb),
      variant: Variant.NEUTRAL,
      contrastLevel: 0,
      isDark,
      primaryPalette: theme.palettes.primary,
      secondaryPalette: theme.palettes.secondary,
      tertiaryPalette: theme.palettes.tertiary,
      neutralPalette: theme.palettes.neutral,
      neutralVariantPalette: theme.palettes.neutralVariant,
      errorPalette: theme.palettes.error,
    });

    return hexFromArgb(colors.background().getArgb(scheme));
  };

  return {
    light: background(false),
    dark: background(true),
  };
}
