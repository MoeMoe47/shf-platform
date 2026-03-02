from __future__ import annotations

from fabric.watchtower.snapshot_verify import write_read_hash_validate


def main() -> int:
    ok, msg = write_read_hash_validate(program_id="__infra_verify__")
    if not ok:
        print("❌", msg)
        return 1
    print("✅", msg)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
