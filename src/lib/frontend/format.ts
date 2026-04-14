import { format } from "date-fns";

export function formatTokenAmount(
  amount: string | number | bigint,
  decimals: number,
  symbol?: string
) {
  const value = BigInt(amount);
  const divisor = 10n ** BigInt(decimals);
  const whole = value / divisor;
  const fraction = value % divisor;

  if (decimals === 0) {
    return symbol ? `${whole.toString()} ${symbol}` : whole.toString();
  }

  const fractionText = fraction
    .toString()
    .padStart(decimals, "0")
    .replace(/0+$/, "");
  const amountText = fractionText.length
    ? `${whole.toString()}.${fractionText}`
    : whole.toString();

  return symbol ? `${amountText} ${symbol}` : amountText;
}

export function formatEventWindow(startIso: string, endIso: string) {
  const start = new Date(startIso);
  const end = new Date(endIso);

  return `${format(start, "EEE, MMM d")} · ${format(start, "HH:mm")} - ${format(
    end,
    "HH:mm"
  )} UTC`;
}

export function formatDayLabel(iso: string) {
  return format(new Date(iso), "MMMM d, yyyy");
}

export function formatDateTimeLabel(iso: string) {
  return format(new Date(iso), "MMM d, yyyy 'at' HH:mm 'UTC'");
}

export function shortenHash(value: string, leading = 8, trailing = 6) {
  if (value.length <= leading + trailing + 3) {
    return value;
  }

  return `${value.slice(0, leading)}...${value.slice(-trailing)}`;
}

export function titleFromScreamingSnake(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => `${part.slice(0, 1).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}
