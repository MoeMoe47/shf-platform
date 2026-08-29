# SHF Data Center & AI Infrastructure Youth Pathway

## Canonical architecture

The Curriculum domain owns the Phase 6 map in
`src/content/curriculum/data-center-pathway-map.json`. It is metadata over the
existing Curriculum lesson hierarchy, not a second course or lesson runtime.
Course records describe progression; executable content is added only when a
lesson exists under `src/content/lessons/*-student/` and is recognized by the
canonical student loader.

The progression is:

`DISCOVER` (grades 6–8) → `EXPLORE` (grades 9–10) → `PREPARE_PROVE` (grades 11–12) → `TRANSITION`.

Career identity remains owned by the Career domain. The map stores career slugs
as presentation relationships and does not create Career records. Lesson
completion remains distinct from competency verification, credentials, or
readiness.

## Master course map

| Grade | Stage | Course | Purpose | Major project | Career connection |
| --- | --- | --- | --- | --- | --- |
| 6 | `DISCOVER` | Where Does the Internet Live? | Digital infrastructure literacy | Visual data-center model | Data Center Technician |
| 7 | `DISCOVER` | Inside the Infrastructure | Systems working together | Classroom troubleshooting model | Data Center Technician |
| 8 | `DISCOVER` | Build a Better Data Center | Design and community tradeoffs | Community-aware design | Data Center Technician |
| 9 | `EXPLORE` | How Data Center Systems Work | Technical foundations | Safe technical system model | Data Center Technician |
| 10 | `EXPLORE` | Operating Reliable Infrastructure | Monitoring and troubleshooting | Simulated incident report | Data Center Technician |
| 11 | `PREPARE_PROVE` | Choose Your Infrastructure Path | Supervised specialization | Specialization evidence plan | Data Center Technician |
| 12 | `PREPARE_PROVE` | From Student to Infrastructure Professional | Integration and transition | Build Ohio's Next AI Data Center | Data Center Technician |

Only the Grade 6 course currently has executable lesson content. The existing
`data-center-foundations-introduction` lesson is the opening lesson and is not
duplicated.

## Domain progression

| Domain | 6 | 7 | 8 | 9 | 10 | 11–12 |
| --- | --- | --- | --- | --- | --- | --- |
| Computing and hardware | Awareness | Foundation | Application | Foundation | Application | Advanced project use |
| Networking and fiber | Awareness | Foundation | Application | Foundation | Application | Specialization option |
| Electricity and power | Awareness | Foundation | Tradeoffs | Foundation | Application | Specialization option |
| Cooling and mechanical systems | Awareness | Foundation | Tradeoffs | Foundation | Application | Specialization option |
| Cybersecurity and physical security | Awareness | Foundation | Community context | Foundation | Application | Specialization option |
| AI infrastructure | Awareness | Awareness | Community context | Foundation | Application | Advanced context |
| Operations and safety | Awareness | Foundation | Design constraints | Foundation | Application | Evidence and transition |
| Sustainability and community impact | Awareness | Foundation | Application | Application | Application | Capstone integration |

## Learning and evidence progression

Grades 6–8 emphasize completion, explanation, reflection, and project artifacts.
Grades 9–10 add supervised labs, scenario responses, and technical records.
Grades 11–12 add project evidence, presentations, and transition planning.
None of these records automatically becomes a verified competency or
credential. Future competency producers must use approved assessment/evidence
boundaries.

## Community learning

Grade 6 introduces digital infrastructure and the existence of community
benefits and questions. Grade 7 examines how systems and resources interact.
Grade 8 requires explicit technical/community tradeoffs. Grades 9–10 connect
reliability, energy, safety, and operations to community decisions. Grades
11–12 integrate workforce, sustainability, local hiring, education, and
community-benefit considerations into the capstone without advocating for a
particular development outcome.

## Safety and future credentials

All technical work is classroom or supervised simulation unless delivered by a
qualified future partner. Students are not directed to perform hazardous
electrical or industrial work. Potential future milestones such as Data Center
Foundations, Infrastructure Safety, Networking Foundations, and AI
Infrastructure Foundations remain planning-only and are not issued by this
phase.
