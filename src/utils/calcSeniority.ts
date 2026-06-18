export interface Seniority {
  years: number;
  months: number;
  days: number;
}

export function calcSeniority(joinDate: string): Seniority {
  const start = new Date(joinDate);
  const now = new Date();
  if (Number.isNaN(start.getTime())) return { years: 0, months: 0, days: 0 };

  let years = now.getFullYear() - start.getFullYear();
  let months = now.getMonth() - start.getMonth();
  let days = now.getDate() - start.getDate();

  if (days < 0) {
    months -= 1;
    const prevMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    days += prevMonth.getDate();
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }
  return { years: Math.max(0, years), months: Math.max(0, months), days: Math.max(0, days) };
}
