import { query } from "../../../db/client.js";

const CAREER_COLUMNS = `
  c.career_id, c.slug, c.title, c.description, c.status, c.career_family_id,
  c.sector, f.slug AS family_slug, f.name AS family_name
`;

export class CareerRepo {
  async listActive() {
    const result = await query(
      `SELECT ${CAREER_COLUMNS}
       FROM careers c JOIN career_families f ON f.career_family_id = c.career_family_id
       WHERE c.status = 'active' AND f.status = 'active'
       ORDER BY f.name, c.title, c.career_id`,
    );
    return result.rows;
  }

  async getBySlug(slug: string) {
    const result = await query(
      `SELECT ${CAREER_COLUMNS}
       FROM careers c JOIN career_families f ON f.career_family_id = c.career_family_id
       WHERE c.slug = $1 AND c.status = 'active' AND f.status = 'active'
       LIMIT 1`,
      [slug],
    );
    return result.rows[0] || null;
  }

  async listCurriculumRequirements(careerId: string) {
    const result = await query(
      `SELECT career_curriculum_requirement_id, career_id, curriculum_id, lesson_id,
              requirement_type, min_grade, max_grade, developmental_stage
       FROM career_curriculum_requirements
       WHERE career_id = $1
       ORDER BY requirement_type, min_grade NULLS LAST, lesson_id`,
      [careerId],
    );
    return result.rows;
  }
}
