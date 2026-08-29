import { CareerRepo } from "../repo/career-repo.js";

function safeSlug(value: string) {
  const slug = String(value || "").trim();
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new Error("invalid_career_slug");
  return slug;
}

export class CareerService {
  constructor(private repo = new CareerRepo()) {}

  listActive() {
    return this.repo.listActive();
  }

  async getBySlug(rawSlug: string) {
    return this.repo.getBySlug(safeSlug(rawSlug));
  }

  async getCurriculumRequirements(rawSlug: string) {
    const career = await this.getBySlug(rawSlug);
    if (!career) return null;
    return { career, requirements: await this.repo.listCurriculumRequirements(career.career_id) };
  }
}
