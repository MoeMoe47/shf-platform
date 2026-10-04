#!/bin/bash

OUT="SALES_AUDIT_0"

EXCLUDES=(
  -g '!node_modules/**'
  -g '!.git/**'
  -g '!dist/**'
  -g '!build/**'
  -g '!test-results/**'
  -g '!tmp/**'
  -g '!SALES_AUDIT_0/**'
  -g '!_archive/**'
  -g '!_backup*/**'
  -g '!_LOCKED*/**'
  -g '!_frozen*/**'
  -g '!_recovery*/**'
  -g '!_restore*/**'
  -g '!_safe*/**'
  -g '!_broken*/**'
  -g '!_emergency*/**'
  -g '!freezes/**'
)

echo "SHU SALES APP — SALES-AUDIT-0" > "$OUT/00_AUDIT_SUMMARY.txt"
echo "Date: $(date)" >> "$OUT/00_AUDIT_SUMMARY.txt"
echo "Root: $(pwd)" >> "$OUT/00_AUDIT_SUMMARY.txt"

echo "1/16 Active project structure..."
find apps src services ui db infra docs contracts scripts tests public \
  -maxdepth 5 -type d 2>/dev/null \
  | sort > "$OUT/01_ACTIVE_STRUCTURE.txt"

echo "2/16 Sales-related files..."
rg --files "${EXCLUDES[@]}" \
  | grep -Ei 'sales|crm|customer|client|lead|opportun|pipeline|growth|proposal|quote|pricing|commission|renewal|retention|funding|grant|meeting|zoom' \
  | sort > "$OUT/02_SALES_RELATED_FILES.txt" || true

echo "3/16 Routes..."
rg -ni "${EXCLUDES[@]}" \
  '(/sales|/growth|sales\.html|SalesRoutes|route.*sales|path.*sales)' \
  . > "$OUT/03_SALES_ROUTES.txt" || true

echo "4/16 Sales UI..."
rg -ni "${EXCLUDES[@]}" \
  'Sales|CRM|Opportunity|Pipeline|Lead|Customer|Deal Room|DealRoom' \
  apps src services ui ./*.html \
  > "$OUT/04_SALES_UI.txt" 2>/dev/null || true

echo "5/16 Accounts and relationships..."
rg -ni "${EXCLUDES[@]}" \
  'organization|account|contact|customer|client|stakeholder|relationship|champion|decision.?maker' \
  apps src services ui db \
  > "$OUT/05_ACCOUNTS_RELATIONSHIPS.txt" 2>/dev/null || true

echo "6/16 Products, programs, catalog and services..."
rg -ni "${EXCLUDES[@]}" \
  'product.?catalog|program.?registry|service.?catalog|catalog|entitlement|offering|bundle|package' \
  apps src services ui db docs \
  > "$OUT/06_PRODUCTS_PROGRAMS_SERVICES.txt" 2>/dev/null || true

echo "7/16 Funding..."
rg -ni "${EXCLUDES[@]}" \
  'funding|grant|WIOA|Perkins|21st.?CCLC|ATE|apprenticeship|sponsor|philanthrop|fundability' \
  apps src services ui db docs \
  > "$OUT/07_FUNDING.txt" 2>/dev/null || true

echo "8/16 Commercial logic..."
rg -ni "${EXCLUDES[@]}" \
  'price|pricing|quote|proposal|contract|margin|revenue|commission|quota|accelerator|discount|clawback' \
  apps src services ui db contracts \
  > "$OUT/08_COMMERCIAL_LOGIC.txt" 2>/dev/null || true

echo "9/16 Onboarding..."
rg -ni "${EXCLUDES[@]}" \
  'onboard|implementation|activation|deployment|customer.?success|success.?plan' \
  apps src services ui db \
  > "$OUT/09_ONBOARDING.txt" 2>/dev/null || true

echo "10/16 Retention and expansion..."
rg -ni "${EXCLUDES[@]}" \
  'retention|renewal|churn|health.?score|customer.?health|expansion|upsell|cross.?sell|advocacy|referral' \
  apps src services ui db \
  > "$OUT/10_RETENTION_EXPANSION.txt" 2>/dev/null || true

echo "11/16 Meetings and Zoom..."
rg -ni "${EXCLUDES[@]}" \
  'zoom|meeting|calendar|video.?conference|transcript|recording|meeting.?note' \
  apps src services ui db \
  > "$OUT/11_MEETINGS_ZOOM.txt" 2>/dev/null || true

echo "12/16 AI and orchestration..."
rg -ni "${EXCLUDES[@]}" \
  'agent.?fabric|copilot|assistant|orchestrat|next.?best.?action|recommendation|sales.?agent' \
  apps src services ui \
  > "$OUT/12_AI_ORCHESTRATION.txt" 2>/dev/null || true

echo "13/16 Evidence and Truth Spine..."
rg -ni "${EXCLUDES[@]}" \
  'truth.?spine|evidence|verified.?report|outcome|portfolio|credential|skill.?profile' \
  apps src services ui db \
  > "$OUT/13_EVIDENCE_TRUTH.txt" 2>/dev/null || true

echo "14/16 Database models..."
rg -ni "${EXCLUDES[@]}" \
  'sales|customer|account|contact|lead|opportunity|proposal|quote|commission|renewal|funding|grant|meeting' \
  db services src apps \
  > "$OUT/14_DATABASE_MODELS.txt" 2>/dev/null || true

echo "15/16 Relevant tests..."
rg --files tests apps src services "${EXCLUDES[@]}" \
  | grep -Ei 'test|spec' \
  | grep -Ei 'sales|customer|opportun|fund|pricing|commission|renew|meeting|crm' \
  > "$OUT/15_RELEVANT_TESTS.txt" || true

echo "16/16 Git status..."
git status --short > "$OUT/16_GIT_STATUS.txt" 2>/dev/null || true

{
  echo "SHU SALES AUDIT COUNTS"
  echo "======================"
  for f in "$OUT"/*.txt; do
    printf "%-45s %s\n" "$(basename "$f")" "$(wc -l < "$f")"
  done
} > "$OUT/17_COUNTS.txt"

echo
echo "========================================"
echo "SALES-AUDIT-0 ACTIVE CODE AUDIT COMPLETE"
echo "========================================"
cat "$OUT/17_COUNTS.txt"
