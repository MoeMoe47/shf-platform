// src/shared/employer/tier.js
export function tierFromStats({ interns=0, hires=0, claimsPaid=0 }) {
  const score = interns + hires*2 + Math.min(claimsPaid, 10);
  if (score >= 20) return "Platinum";
  if (score >= 12) return "Gold";
  if (score >= 6)  return "Silver";
  return "Bronze";
}
