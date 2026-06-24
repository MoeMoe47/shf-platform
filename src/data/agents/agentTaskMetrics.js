export function calculateAgentTaskMetrics(tasks = [], agents = []) {
  const totalTasks = tasks.length;
  const byStatus = tasks.reduce((acc, task) => {
    acc[task.status] = (acc[task.status] || 0) + 1;
    return acc;
  }, {});

  const approvedTasks = tasks.filter((task) => task.approval_status === "approved").length;
  const rejectedTasks = tasks.filter((task) => task.approval_status === "rejected").length;
  const approvalDecisionCount = approvedTasks + rejectedTasks;

  const perAgentTaskCount = agents.map((agent) => ({
    agent_id: agent.id,
    name: agent.name,
    count: tasks.filter((task) => task.assigned_agent_id === agent.id).length,
  }));

  const lastActivity = tasks
    .flatMap((task) => (task.audit_events || []).map((event) => event.created_at))
    .filter(Boolean)
    .sort()
    .at(-1) || null;

  return {
    total_tasks: totalTasks,
    pending_tasks: (byStatus.draft || 0) + (byStatus.queued || 0) + (byStatus.in_review || 0),
    approved_tasks: approvedTasks,
    rejected_tasks: rejectedTasks,
    completed_tasks: byStatus.completed || 0,
    blocked_tasks: byStatus.blocked || 0,
    per_agent_task_count: perAgentTaskCount,
    approval_rate: approvalDecisionCount ? Math.round((approvedTasks / approvalDecisionCount) * 100) : null,
    last_activity: lastActivity,
  };
}
