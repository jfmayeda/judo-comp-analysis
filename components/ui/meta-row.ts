export type MetaRowItem = {
  label: string;
  value: string | null | undefined;
  capitalize?: boolean;
};

export type VisibleMetaItem = {
  label: string;
  value: string;
  capitalize: boolean;
};

function displayValue(item: VisibleMetaItem): string {
  if (!item.capitalize) return item.value;
  return item.value.replace(/\S+/g, (word) => word.charAt(0).toUpperCase() + word.slice(1));
}

export function visibleMetaItems(items: MetaRowItem[]): VisibleMetaItem[] {
  return items.flatMap((item) => {
    const value = item.value?.trim();
    if (!value) return [];
    return [{ label: item.label, value, capitalize: Boolean(item.capitalize) }];
  });
}

/** Space-joined "Label: Value" used so Stance/Weight cannot concatenate as RightWEIGHT. */
export function metaRowPlainText(items: MetaRowItem[]): string {
  return visibleMetaItems(items)
    .map((item) => `${item.label}: ${displayValue(item)}`)
    .join(' ');
}
