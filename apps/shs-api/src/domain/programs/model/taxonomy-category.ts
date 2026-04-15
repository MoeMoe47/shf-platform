export interface TaxonomyCategory {
  category_id: string;
  category_name: string;
  description: string;
  synonyms: string[];
  reporting_group: string;
  active_status: "active" | "inactive";
}
