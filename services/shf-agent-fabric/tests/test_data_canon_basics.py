import unittest

from fabric.data_canon import (
    list_datasets,
    upsert_dataset,
    get_dataset,
    delete_dataset,
    verify_data_registry,
)

class TestDataCanonBasics(unittest.TestCase):
    def test_upsert_get_delete(self):
        upsert_dataset("pilot_outcomes", {"label": "Pilot Outcomes", "owner_app_id": "loo", "type": "metric"})
        d = get_dataset("pilot_outcomes")
        self.assertIsNotNone(d)
        self.assertEqual(d["dataset_id"], "pilot_outcomes")
        rows = list_datasets()
        self.assertTrue(any(r.get("dataset_id") == "pilot_outcomes" for r in rows))
        ok = delete_dataset("pilot_outcomes")
        self.assertTrue(ok)

    def test_verify(self):
        v = verify_data_registry()
        self.assertIn("ok", v)
        self.assertIn("ledger", v)

if __name__ == "__main__":
    unittest.main()
