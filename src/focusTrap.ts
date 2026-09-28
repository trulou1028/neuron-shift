const FOCUSABLE = 'button:not([disabled]), [href], input:not([disabled]), textarea, [tabindex]:not([tabindex="-1"])';

/**
 * Keeps Tab inside an open dialog. The tour card, when present, joins the loop,
 * so keyboard users can reach the tour while a dialog is open.
 */
export function trapFocus(event: KeyboardEvent, dialog: HTMLElement | null) {
  if (event.key !== "Tab" || !dialog) return;
  const scopes = [dialog, document.querySelector<HTMLElement>(".tour-card")].filter(Boolean) as HTMLElement[];
  const focusable = scopes.flatMap((scope) => Array.from(scope.querySelectorAll<HTMLElement>(FOCUSABLE)));
  if (focusable.length === 0) return;

  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  const active = document.activeElement;
  const inside = scopes.some((scope) => scope.contains(active));

  if (event.shiftKey && (active === first || !inside)) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && (active === last || !inside)) {
    event.preventDefault();
    first.focus();
  }
}

export const firstFocusable = (root: HTMLElement | null) => root?.querySelector<HTMLElement>(FOCUSABLE) ?? null;
