/**
 * Horaires d'ouverture jour par jour : [À CONFIRMER] auprès du restaurant.
 * Seule la fermeture (23h30) est vérifiée. Tant que `schedule` est `null`,
 * aucun statut "ouvert/fermé" n'est calculé ni affiché — on ne devine pas
 * des horaires qu'on ne connaît pas. Une fois les horaires confirmés,
 * remplir `schedule` avec, pour chaque jour (0 = dimanche … 6 = samedi),
 * un tableau de créneaux [{ open: "HH:MM", close: "HH:MM" }].
 */
export type DaySchedule = { open: string; close: string }[];

export const schedule: Record<number, DaySchedule> | null = null;

export function isOpenNow(now: Date = new Date()): boolean | null {
  if (!schedule) return null;

  const day = now.getDay();
  const todaySlots = schedule[day];
  if (!todaySlots || todaySlots.length === 0) return false;

  const minutesNow = now.getHours() * 60 + now.getMinutes();

  return todaySlots.some(({ open, close }) => {
    const [openH, openM] = open.split(":").map(Number);
    const [closeH, closeM] = close.split(":").map(Number);
    const openMinutes = openH * 60 + openM;
    const closeMinutes = closeH * 60 + closeM;
    return minutesNow >= openMinutes && minutesNow <= closeMinutes;
  });
}
