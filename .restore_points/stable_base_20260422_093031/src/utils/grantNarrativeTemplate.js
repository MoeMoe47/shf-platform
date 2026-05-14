// src/utils/grantNarrativeTemplate.js

/**
 * MASTER GRANT NARRATIVE — MARKDOWN TEMPLATE
 * This is a plain template string. buildGrantNarrative()
 * will take this and replace the {{placeholders}}.
 */

export const MASTER_GRANT_NARRATIVE_TEMPLATE = `# Silicon Heartland Foundation — Grant Narrative

_Last updated: {{updatedAt}}_

---

## **1. Executive Summary**

Silicon Heartland Foundation demonstrates consistent, documented use of AI-supported workflows across **funding**, **sales**, **curriculum**, and **civic impact** missions.

This narrative is auto-generated from:
- **{{adminCount}}** Admin AI sessions  
- **{{civicCount}}** Civic mission logs  
- **{{totalTimeHours}}** total hours of AI-assisted work

The combined log stream represents authentic, timestamped operational activity.

---

## **2. Organizational Need**

Across all tracked missions, staff and students used AI tools to:
- Draft funding proposals
- Build employer partnerships
- Improve curriculum quality
- Process civic analysis and student proposals

The frequency and diversity of activity demonstrate:
- a clear organizational need,
- responsible use of AI,
- and an evidence-based pathway for scaling programs.

---

## **3. Project Activities**

### **3.1 Funding & Grants Workflow**

AI-supported sessions executed:
{{#Funding}}
- **{{when}}** — _{{tool}}_ ({{duration}} min): {{headline}}
{{/Funding}}

### **3.2 Sales & Employer Outreach**

AI-supported sessions executed:
{{#Sales}}
- **{{when}}** — _{{tool}}_ ({{duration}} min): {{headline}}
{{/Sales}}

### **3.3 Curriculum Development**

AI-supported sessions executed:
{{#Curriculum}}
- **{{when}}** — _{{tool}}_ ({{duration}} min): {{headline}}
{{/Curriculum}}

### **3.4 Product & UX**

AI-supported sessions executed:
{{#Product}}
- **{{when}}** — _{{tool}}_ ({{duration}} min): {{headline}}
{{/Product}}

### **3.5 Civic Impact / Constitution Missions**

AI-supported civic missions:
{{#Civic}}
- **{{when}}** — _Mission: {{mission}}_ ({{duration}} min):  
  {{summary}}
{{/Civic}}

---

## **4. Outputs and Deliverables**

Automatically tallied from the combined logs:

| Output Type | Count |
|------------|-------|
| Grant prep sessions | **{{fundingCount}}** |
| Sales & outreach sessions | **{{salesCount}}** |
| Curriculum build sessions | **{{curriculumCount}}** |
| Product & UX sessions | **{{productCount}}** |
| Civic mission sessions | **{{civicMissionCount}}** |
| Total AI-assisted hours | **{{totalTimeHours}}** |

Each log includes:
- Tool used  
- Org (Foundation / Solutions / Both)  
- Category  
- Notes + Outcome Headline  
- Duration  
- Timestamp  

These become the evidence base for federal/state funding.

---

## **5. Program Impact**

Key patterns identified across the logs:

**Funding & Grants:**  
{{impactFunding}}

**Sales & Employer Outreach:**  
{{impactSales}}

**Curriculum & Workforce Training:**  
{{impactCurriculum}}

**Product & UX:**  
{{impactProduct}}

**Civic Impact:**  
{{impactCivic}}

---

## **6. Sustainability + Scaling Plan**

AI-assisted workflows allow Silicon Heartland to:
- Reduce grant writing time  
- Increase curriculum production speed  
- Maintain high product quality  
- Document civic decision-making at scale  
- Provide a transparent ledger of organizational activity  

These logs demonstrate that SHF is ready to scale responsibly.

---

## **7. Appendix: Complete AI Log Ledger**

Below is the full record of Admin + Civic AI-assisted actions:

{{#All}}
- **{{when}}** — _{{toolOrMission}}_ — {{org}} — {{category}} — {{duration}} min  
  {{notes}}
{{/All}}

---

_This narrative was automatically generated from the Silicon Heartland AI Operational Ledger (Admin + Civic merged)._
`;
