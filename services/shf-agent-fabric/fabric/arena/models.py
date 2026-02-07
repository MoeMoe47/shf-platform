from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, Literal, Optional

Persona = Literal["TEACHER", "ENTERTAINER", "ANALYST", "STORYTELLER", "DEBATER"]
Tone = Literal["FRIENDLY", "SERIOUS", "PLAYFUL", "NEUTRAL"]
Length = Literal["SHORT", "MEDIUM", "LONG"]
GradeLevel = Literal["ELEMENTARY", "MIDDLE", "HIGH"]
LearningMode = Literal["ADAPTIVE", "REFLECTIVE", "CONSISTENT"]
AgentStatus = Literal["DRAFT", "LOCKED_RELEASED"]

Strategy = Literal[
    "HOOK_FIRST",
    "STEP_BY_STEP",
    "STORYTELLING",
    "DEBATE",
    "SHORT_PUNCHY",
    "BALANCED",
]

@dataclass
class Agent:
    agentId: str
    ownerStudentId: str
    name: str
    avatarId: str
    persona: Persona
    strengths: Dict[str, int]
    communication: Dict[str, str]
    learningMode: LearningMode
    status: AgentStatus
    createdAt: str


@dataclass
class RoundSummary:
    roundId: str
    arenaId: str
    status: Literal["LIVE", "FINAL"]
    startedAt: str
    endedAt: Optional[str]
    prompt: str
    rulesetVersion: str
