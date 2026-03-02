import json, sys
from pathlib import Path

P = Path("src/apps/allocation/franklin-baseline.json")

def fail(msg: str) -> None:
    print(f"❌ franklin-baseline.json validation failed: {msg}")
    sys.exit(1)

def is_int(x): return isinstance(x, int) and not isinstance(x, bool)
def is_num(x): return isinstance(x, (int, float)) and not isinstance(x, bool)

d = json.loads(P.read_text())

try:
    a7 = d["wioa"]["area7"]
    perf = a7["performance"]
    demo = a7["demographics"]["totals"]
except Exception as e:
    fail(f"Missing required keys: {e}")

# --- Totals checks ---
for k in ["participants_served", "participants_exited", "new_py24_enrollees"]:
    if k not in demo: fail(f"Missing demographics.totals.{k}")
    for prog in ["adult", "dislocated_worker", "youth"]:
        v = demo[k].get(prog)
        if not is_int(v): fail(f"{k}.{prog} must be int, got {v!r}")

# --- Performance checks ---
def check_rate(obj, path):
    if not is_num(obj.get("rate")): fail(f"{path}.rate missing/invalid")
    r = float(obj["rate"])
    if r < 0 or r > 1: fail(f"{path}.rate out of range 0..1: {r}")

def check_fraction(obj, path, rate_required=True):
    n = obj.get("numerator")
    den = obj.get("denominator")
    if not is_int(n) or not is_int(den): fail(f"{path} numerator/denominator must be ints")
    if den <= 0: fail(f"{path}.denominator must be >0")
    if n < 0 or n > den: fail(f"{path} numerator must be 0..denominator")
    if rate_required: check_rate(obj, path)

def check_earnings(obj, path):
    den = obj.get("denominator")
    usd = obj.get("usd")
    if not is_int(den) or den <= 0: fail(f"{path}.denominator must be int >0")
    if not is_int(usd) or usd < 0: fail(f"{path}.usd must be int >=0")

# Adult
check_fraction(perf["adult"]["employment_2nd_qtr_after_exit"], "performance.adult.employment_2nd_qtr_after_exit")
check_fraction(perf["adult"]["employment_4th_qtr_after_exit"], "performance.adult.employment_4th_qtr_after_exit")
check_earnings(perf["adult"]["median_earnings_2nd_qtr_after_exit"], "performance.adult.median_earnings_2nd_qtr_after_exit")
check_fraction(perf["adult"]["credential_attainment"], "performance.adult.credential_attainment")
check_fraction(perf["adult"]["measurable_skill_gains"], "performance.adult.measurable_skill_gains")

# Dislocated Worker
check_fraction(perf["dislocated_worker"]["employment_2nd_qtr_after_exit"], "performance.dislocated_worker.employment_2nd_qtr_after_exit")
check_fraction(perf["dislocated_worker"]["employment_4th_qtr_after_exit"], "performance.dislocated_worker.employment_4th_qtr_after_exit")
check_earnings(perf["dislocated_worker"]["median_earnings_2nd_qtr_after_exit"], "performance.dislocated_worker.median_earnings_2nd_qtr_after_exit")
check_fraction(perf["dislocated_worker"]["credential_attainment"], "performance.dislocated_worker.credential_attainment")
check_fraction(perf["dislocated_worker"]["measurable_skill_gains"], "performance.dislocated_worker.measurable_skill_gains")

# Youth
check_fraction(perf["youth"]["education_training_employment_2nd_qtr_after_exit"], "performance.youth.education_training_employment_2nd_qtr_after_exit")
check_fraction(perf["youth"]["education_training_employment_4th_qtr_after_exit"], "performance.youth.education_training_employment_4th_qtr_after_exit")
check_earnings(perf["youth"]["median_earnings_2nd_qtr_after_exit"], "performance.youth.median_earnings_2nd_qtr_after_exit")
check_fraction(perf["youth"]["credential_attainment"], "performance.youth.credential_attainment")
check_fraction(perf["youth"]["measurable_skill_gains"], "performance.youth.measurable_skill_gains")

print("✅ franklin-baseline.json looks valid.")
