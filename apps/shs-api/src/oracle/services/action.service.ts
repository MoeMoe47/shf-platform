type OracleActionType = "execute" | "hold" | "request_data";

type OracleActionRecord = {
  entityId: string;
  action: OracleActionType;
  status: "accepted";
  message: string;
  createdAt: string;
};

const ACTION_LOG: OracleActionRecord[] = [];

export function runOracleAction(entityId: string, action: OracleActionType) {
  let message = "Action recorded.";

  if (action === "execute") {
    message = `Execution authorized for ${entityId}.`;
  } else if (action === "hold") {
    message = `Case ${entityId} placed on hold for additional review.`;
  } else if (action === "request_data") {
    message = `Additional data requested for ${entityId}.`;
  }

  const record: OracleActionRecord = {
    entityId,
    action,
    status: "accepted",
    message,
    createdAt: new Date().toISOString(),
  };

  ACTION_LOG.unshift(record);

  return record;
}

export function listOracleActions() {
  return ACTION_LOG;
}
