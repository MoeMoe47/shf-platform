import React from "react";
import { Link } from "react-router-dom";
import { useUser } from "@/context/UserContext.jsx";
import { addStudioTeamMember, createStudioTeam, getStudioTeam, listStudioTeams, removeStudioTeamMember } from "@/lib/studio/api.js";

export default function StudioTeams() {
  const { role } = useUser();
  const [state, setState] = React.useState({ loading: true, error: null, items: [] });
  const [name, setName] = React.useState("");
  const [selected, setSelected] = React.useState(null);
  const [memberId, setMemberId] = React.useState("");
  const canManage = ["admin", "instructor"].includes(role);
  async function load() { try { const data = await listStudioTeams(role); setState({ loading: false, error: null, items: data.items || [] }); } catch (error) { setState({ loading: false, error, items: [] }); } }
  React.useEffect(() => { load(); }, [role]);
  async function create(event) { event.preventDefault(); if (!name.trim()) return; await createStudioTeam(role, name.trim()); setName(""); await load(); }
  async function open(teamId) { setSelected(await getStudioTeam(role, teamId)); }
  async function add(event) { event.preventDefault(); if (!memberId.trim() || !selected) return; await addStudioTeamMember(role, selected.teamId, memberId.trim()); setMemberId(""); await open(selected.teamId); }
  async function remove(userId) { await removeStudioTeamMember(role, selected.teamId, userId); await open(selected.teamId); }
  return <main className="studio-page studio-page--narrow" aria-labelledby="studio-teams-heading"><Link className="studio-backLink" to="/studio">Back to Studio</Link><header className="studio-pageHeader"><p className="studio-eyebrow">Team Project Authority</p><h1 className="ld-h1" id="studio-teams-heading">Teams</h1><p className="studio-lede">Teams identify authorized contributors. Each person still acts through their own account.</p></header>{canManage && <form className="studio-form" onSubmit={create}><label className="studio-field"><span>Team name</span><input value={name} onChange={(event) => setName(event.target.value)} maxLength={160} required /></label><button className="studio-primaryButton" type="submit">Create Team</button></form>}{state.error && <p className="studio-error" role="alert">Teams are unavailable right now.</p>}{!state.loading && !state.items.length && <p className="studio-muted" role="status">You are not currently on a team.</p>}{state.items.map((team) => <section className="studio-panel" key={team.teamId} aria-labelledby={`team-${team.teamId}`}><h2 id={`team-${team.teamId}`}>{team.name}</h2><p className="studio-muted">{team.status} · Team Project Authority</p><button className="studio-secondaryButton" type="button" onClick={() => open(team.teamId)}>View members</button>{selected?.teamId === team.teamId && <><ul className="studio-historyList">{selected.members.map((member) => <li key={member.membership_id}><strong>{member.user_id}</strong><span>{member.role}</span>{canManage && <button className="studio-textLink" type="button" onClick={() => remove(member.user_id)}>Remove</button>}</li>)}</ul>{canManage && <form className="studio-form" onSubmit={add}><label className="studio-field"><span>Member user ID</span><input value={memberId} onChange={(event) => setMemberId(event.target.value)} required /></label><button className="studio-primaryButton" type="submit">Add member</button></form>}</>}</section>)}</main>;
}
