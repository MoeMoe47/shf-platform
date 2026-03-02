from __future__ import annotations
from typing import Dict, Any, List
import secrets
import psycopg2
import os
import json

DB = os.getenv("SHF_DATABASE_URL", "postgresql://localhost:5432/shf")

def conn():
    return psycopg2.connect(DB)


def register_partner(partner_id:str, partner_type:str, programs:list, rulesets:list):

    token = secrets.token_urlsafe(32)

    with conn() as c:
        with c.cursor() as cur:
            cur.execute(
                """
                INSERT INTO funding_partners
                (partner_id, partner_type, programs, allowed_rulesets, integration_token)
                VALUES (%s,%s,%s,%s,%s)
                ON CONFLICT (partner_id) DO NOTHING
                """,
                (
                    partner_id,
                    partner_type,
                    json.dumps(programs),
                    json.dumps(rulesets),
                    token
                )
            )

    return {
        "schema_version": "AIM_PARTNER_REGISTER_V1",
        "partner_id": partner_id,
        "status": "registered",
        "allowed_rulesets": rulesets,
        "integration_token": token
    }


def add_webhook(partner_id:str, url:str, events:list):

    with conn() as c:
        with c.cursor() as cur:
            cur.execute(
                """
                INSERT INTO funding_webhooks
                (partner_id,url,events)
                VALUES (%s,%s,%s)
                """,
                (partner_id,url,json.dumps(events))
            )

    return {
        "schema_version": "AIM_WEBHOOK_REGISTER_V1",
        "partner_id": partner_id,
        "status": "webhook_registered"
    }


def network_map():

    with conn() as c:
        with c.cursor() as cur:

            cur.execute(
                """
                SELECT partner_id, partner_type, programs, allowed_rulesets
                FROM funding_partners
                """
            )

            rows = cur.fetchall()

    partners=[]

    for r in rows:
        partners.append(
            {
                "partner_id": r[0],
                "type": r[1],
                "programs": r[2],
                "active_rulesets": r[3]
            }
        )

    return {
        "schema_version":"AIM_NETWORK_V1",
        "partners":partners
    }


def verify_outcome(data:Dict[str,Any]):

    with conn() as c:
        with c.cursor() as cur:

            cur.execute(
                """
                INSERT INTO funding_outcome_verifications
                (partner_id,ruleset_id,participant_id,event,verification_source)
                VALUES (%s,%s,%s,%s,%s)
                """,
                (
                    data.get("partner_id"),
                    data.get("ruleset_id"),
                    data.get("participant_id"),
                    data.get("event"),
                    data.get("verification_source")
                )
            )

    return {
        "schema_version":"AIM_OUTCOME_VERIFICATION_ACK_V1",
        "ok":True
    }
