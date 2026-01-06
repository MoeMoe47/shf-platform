/** Central toggle matrix for upgrades per app. */
export const APP_FLAGS = {
  career:        { useUnifiedShell: false, offline: true,  evidencePack: true, showProgressUI: false },
  civic:         { useUnifiedShell: true,  offline: true,  evidencePack: true, showProgressUI: true  },
  arcade:        { useUnifiedShell: true,  offline: true,  evidencePack: true, showProgressUI: true  },
  credit:        { useUnifiedShell: true,  offline: true,  evidencePack: true, showProgressUI: true  },
  debt:          { useUnifiedShell: true,  offline: true,  evidencePack: true, showProgressUI: true  },
  treasury:      { useUnifiedShell: true,  offline: true,  evidencePack: true, showProgressUI: true  },
  curriculum:    { useUnifiedShell: true,  offline: true,  evidencePack: true, showProgressUI: true  },
  ai:            { useUnifiedShell: true,  offline: true,  evidencePack: true, showProgressUI: true  },
  launch:        { useUnifiedShell: true,  offline: true,  evidencePack: true, showProgressUI: true  },
  store:         { useUnifiedShell: true,  offline: true,  evidencePack: true, showProgressUI: true  },
  // excluded from this sprint:
  employer:      { useUnifiedShell: false, offline: false, evidencePack: false, showProgressUI: false },
  sales:         { useUnifiedShell: false, offline: false, evidencePack: false, showProgressUI: false },
  solutions:     { useUnifiedShell: false, offline: false, evidencePack: false, showProgressUI: false },
  foundation:    { useUnifiedShell: false, offline: false, evidencePack: false, showProgressUI: false },
};

export function isEnabled(app, key) {
  return !!(APP_FLAGS[app] && APP_FLAGS[app][key]);
}
