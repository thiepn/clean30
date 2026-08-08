export const appearancePresets = [
  {
    id: "light",
    label: "Light",
    description: "Clean and bright",
    accentColor: "blue",
    backgroundColor: "white"
  },
  {
    id: "warm",
    label: "Warm",
    description: "Soft and comfortable",
    accentColor: "brown",
    backgroundColor: "cream"
  },
  {
    id: "calm",
    label: "Calm",
    description: "Quiet green tones",
    accentColor: "green",
    backgroundColor: "mint"
  },
  {
    id: "slate",
    label: "Slate",
    description: "Neutral and subdued",
    accentColor: "charcoal",
    backgroundColor: "slate"
  }
];

export function getAppearancePresetId(appearance = {}) {
  return (
    appearancePresets.find(
      (preset) =>
        preset.accentColor === appearance.accentColor &&
        preset.backgroundColor === appearance.backgroundColor
    )?.id || "custom"
  );
}

export function getAppearancePreset(presetId) {
  return appearancePresets.find((preset) => preset.id === presetId) || null;
}
