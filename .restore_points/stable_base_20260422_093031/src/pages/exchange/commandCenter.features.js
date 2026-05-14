export const COMMAND_CENTER_MODES = {
  operator: {
    predictionPanel: true,
    simulationPanel: true,
    reportActions: true,
    decisionSignal: true,
  },
  investor: {
    predictionPanel: true,
    simulationPanel: false,
    reportActions: false,
    decisionSignal: true,
  },
  auditor: {
    predictionPanel: true,
    simulationPanel: false,
    reportActions: true,
    decisionSignal: true,
  },
  lite: {
    predictionPanel: false,
    simulationPanel: false,
    reportActions: false,
    decisionSignal: true,
  },
};

// Default mode
export const DEFAULT_MODE = "operator";
