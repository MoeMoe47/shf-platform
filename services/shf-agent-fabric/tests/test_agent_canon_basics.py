import unittest

from fabric.agent_canon import (
    load_agents,
    list_agents,
    upsert_agent,
    get_agent,
    delete_agent,
    verify_agents,
)

class TestAgentCanonBasics(unittest.TestCase):
    def test_upsert_get_delete(self):
        upsert_agent("watchtower", {"label": "Watchtower", "capabilities": ["observe"]})
        a = get_agent("watchtower")
        self.assertIsNotNone(a)
        self.assertEqual(a["agent_id"], "watchtower")
        self.assertIn("label", a)
        rows = list_agents()
        self.assertTrue(any(r.get("agent_id") == "watchtower" for r in rows))
        ok = delete_agent("watchtower")
        self.assertTrue(ok)

    def test_verify_agents(self):
        v = verify_agents()
        self.assertIn("ok", v)
        self.assertIn("ledger", v)

if __name__ == "__main__":
    unittest.main()
