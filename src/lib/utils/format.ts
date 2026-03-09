export function formatCnyFromUsd(value: number) {
  if (value === 0) return "¥0";
  const estimated = Math.round(value * 7.2);
  return `¥${estimated}`;
}

export function formatDate(iso: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}
