# Canonical Authority and Ownership Map

This is a proposed technical and governance map, not a legal ownership determination. Where the repository does not establish a fact, the status remains unresolved.

## Actor and structure map

| Actor/structure | Proposed architecture owner | Repository technical authority | Legal evidence status | Required decision maker / counsel | Open question and blocking effect |
|---|---|---|---|---|---|
| SHF | Charitable mission, programs, grants, participant protection | Organizations, programs, curriculum, evidence, reporting | `DOCUMENTED_ARCHITECTURE_ONLY` | SHF board; nonprofit/tax counsel | Formation, tax status, officers, signing authority and asset ownership require `EXTERNAL_RECORD_REQUIRED`; blocks external programs |
| SHS | Commercial software, BOS, ARAG-1, services and commercial operations | SHS services, Agent Fabric, ARAG-1, commercial routes | `DOCUMENTED_ARCHITECTURE_ONLY` | SHS owner; commercial/IP counsel | Legal identity, ownership, authority and licenses require `EXTERNAL_RECORD_REQUIRED`; blocks commercial operation assumptions |
| SHF-owned program | SHF program owner and accountable organization | Program stewardship and curriculum | `DOCUMENTED_ARCHITECTURE_ONLY` | SHF board/program owner | What agreement, funds, data and IP attach to the program? |
| SHF-incubated program | SHF sponsor/owner until approved transition; operator unresolved | `032_organization_relationships_program_stewardship.sql` | `DOCUMENTED_ARCHITECTURE_ONLY` | SHF board; nonprofit/tax/IP counsel | Sponsorship, custody, spinout and liability unresolved; blocks incubation |
| Independent network nonprofit | Independent board, mission, funds, people and data | Organization relationship and membership controls | `DOCUMENTED_ARCHITECTURE_ONLY` | Independent board and counsel | Relationship must not imply agency, fiscal sponsorship, ownership or control; blocks onboarding |
| School or district | School/district governance and eligibility | Enrollment, curriculum and identity | `MISSING` | School/district and education/privacy counsel | Data, safeguarding, accommodations and records terms unresolved |
| Employer | Employer workplace and hiring authority | Career opportunity/interview/placement records | `DOCUMENTED_ARCHITECTURE_ONLY` | Employer and workforce counsel | Classification, safety, data and claim distinctions unresolved |
| Student or participant | Participant rights and program participation | User, enrollment, assignment, Studio and evidence records | `MISSING` | SHF/owner; education/privacy counsel | Terms, consent, student-work rights and public use unresolved |
| Parent or guardian | Consent authority where legally required | No verified consent authority | `MISSING` | Guardian/SHF; education/privacy counsel | Age, authority, scope and withdrawal unresolved |
| Instructor/facilitator | Instructional delivery under employing/contracting entity | Roles, permissions, curriculum | `MISSING` | Employing entity; employment/education counsel | Employment, content rights and safety unresolved |
| Vendor/provider | Contracted service provider only | Provider/adapter metadata and technical access | `DOCUMENTED_ARCHITECTURE_ONLY` | Contract owner; privacy/technology counsel | Processor terms, subprocessors, insurance and offboarding unresolved |
| AI provider | Provider subject to contract and policy | Agent provider/model metadata | `DOCUMENTED_ARCHITECTURE_ONLY` | SHS/customer; AI/IP/privacy counsel | Data use, output rights, model change and adapter revocation unresolved |
| AI agent operator | Accountable human/org operator | Agent registry, policy runtime and action evidence | `DOCUMENTED_ARCHITECTURE_ONLY` | Owner; AI/technology counsel | Operator liability, work orders and approval requirements unresolved |
| ARAG-1 customer | Customer owns repository/policy authorization decisions | ARAG-1 release/policy controls | `DOCUMENTED_ARCHITECTURE_ONLY` | Customer and commercial counsel | Customer authorization and reliance limits unresolved; blocks pilot |
| Grantor | Grantor restrictions and reporting rights | Grant binders, commitments, metrics and reporting | `EXTERNAL_RECORD_REQUIRED` | Grantor/SHF; grants counsel | Restrictions and attribution cannot be inferred from schema |
| Donor | Donor restrictions subject to governing records | Grant/funding records | `EXTERNAL_RECORD_REQUIRED` | SHF board/accounting/counsel | Donor restrictions and public attribution unresolved |
| Auditor/verifier | Independent verification within authorized scope | Evidence verifier and Truth Spine paths | `DOCUMENTED_ARCHITECTURE_ONLY` | Institution and auditor | Independence, reliance, correction and scope unresolved |

For every row, technical administration is not legal signing authority, program ownership, fiduciary authority, employment, agency or permission to spend.

## Asset and data ownership decisions

| Asset/data | Proposed technical custodian | Legal owner/controller | License/public/commercial rights | Status and required decision |
|---|---|---|---|---|
| Curriculum | Curriculum domain / SHF program systems | Unresolved | Reproduction/adaptation/license unresolved | `OWNER_DECISION_REQUIRED`, `COUNSEL_REVIEW_REQUIRED` |
| Books and instructional materials | Curriculum/content systems | Unresolved; author/contributor rights may apply | License and derivative rights unresolved | `COUNSEL_REVIEW_REQUIRED` |
| SHS software | SHS source and commercial infrastructure | Architecture proposes SHS; legal proof absent | SHF/customer licenses unresolved | `OWNER_DECISION_REQUIRED`, `COUNSEL_REVIEW_REQUIRED` |
| Platform improvements | Product/source repositories | Unresolved contribution and assignment policy | Employee/contractor/student contribution rights unresolved | `COUNSEL_REVIEW_REQUIRED` |
| Student websites | Studio projects/revisions | Unresolved student/program rights | Portfolio, deployment and commercial license unresolved | `COUNSEL_REVIEW_REQUIRED` |
| Student games | Studio/Arcade project records | Unresolved | Publication, media and third-party rights unresolved | `COUNSEL_REVIEW_REQUIRED` |
| Student AI agents | Studio and Autonomous Registry | Unresolved student/program/provider rights | Model/output/provider rights unresolved | `COUNSEL_REVIEW_REQUIRED` |
| Project submissions | Studio revisions and evidence | Unresolved | Review, evidence, portfolio and release permission unresolved | `OWNER_DECISION_REQUIRED`, `COUNSEL_REVIEW_REQUIRED` |
| Portfolio artifacts | Portfolio domain | Unresolved | Public display and takedown rights unresolved | `COUNSEL_REVIEW_REQUIRED` |
| AI-generated output | Agent/project records | Unresolved; provider terms may control | Ownership, disclosure and commercial use unresolved | `COUNSEL_REVIEW_REQUIRED` |
| Third-party media | Project/release evidence | Third-party owner | License/clearance required | `MISSING`, `COUNSEL_REVIEW_REQUIRED` |
| Incubated-program IP | Program/project records | Owner/operator unresolved | Spinout and post-spinout license unresolved | `BOARD_DECISION_REQUIRED`, `COUNSEL_REVIEW_REQUIRED` |
| Independent nonprofit IP | Independent organization | Independent organization unless agreed otherwise | Shared services/use license unresolved | `OWNER_DECISION_REQUIRED`, `COUNSEL_REVIEW_REQUIRED` |
| SHF trademarks | SHF records, if legally owned | External record required | Brand license and approval unresolved | `COUNSEL_REVIEW_REQUIRED` |
| SHS trademarks | SHS records, if legally owned | External record required | Brand license and approval unresolved | `COUNSEL_REVIEW_REQUIRED` |
| Participant data | Identity/curriculum/evidence domains | Program-specific controller unresolved | Purpose, consent, sharing and retention unresolved | `COUNSEL_REVIEW_REQUIRED` |
| Education records | Enrollment, assessment and completion domains | SHF/school-specific controller unresolved | Education-record access/publication unresolved | `COUNSEL_REVIEW_REQUIRED` |
| Accommodation records | `authorized_accommodations` | Organization-specific controller unresolved | Need-to-know access and retention unresolved | `COUNSEL_REVIEW_REQUIRED` |
| Workforce records | Career domain | SHF/employer-specific controller unresolved | Consent and verification rights unresolved | `COUNSEL_REVIEW_REQUIRED` |
| Agent interactions | Agent Fabric and project records | Organization/customer-specific controller unresolved | Provider processing and retention unresolved | `COUNSEL_REVIEW_REQUIRED` |
| Repository/release evidence | ARAG-1 and release systems | Customer/repository owner and SHS roles unresolved | Confidentiality and authorization unresolved | `COUNSEL_REVIEW_REQUIRED` |
| Truth Spine evidence | Truth Spine / verified evidence | Source authority remains controlling | Public/reliance rights unresolved | `DOCUMENTED_ARCHITECTURE_ONLY` |
| Metrics/public claims | Metric Registry and Reporting Service | Claim owner and approver unresolved | Attribution, correction and publication rights unresolved | `COUNSEL_REVIEW_REQUIRED` |

