export function getExperienceById(experiences, id) {
  return experiences.find((experience) => experience?.id === id || experience?.experienceId === id) ?? null;
}

export function getExperienceBySlug(experiences, slug) {
  return experiences.find((experience) => experience?.slug === slug || experience?.descriptor?.slug === slug) ?? null;
}

export function listExperiencesByFamily(experiences, family) {
  return experiences.filter((experience) => {
    const descriptor = experience?.descriptor ?? experience;
    return descriptor?.product?.family === family;
  });
}

export function listLaunchableExperiences(experiences) {
  return experiences.filter((experience) => {
    const descriptor = experience?.descriptor ?? experience;
    return descriptor?.lifecycle?.launchable === true;
  });
}

export function listPlayableExperiences(experiences) {
  return experiences.filter((experience) => {
    const descriptor = experience?.descriptor ?? experience;
    return descriptor?.lifecycle?.playable === true;
  });
}

export function listLearningExperiences(experiences) {
  return listExperiencesByFamily(experiences, "learning");
}

export function listClassicExperiences(experiences) {
  return listExperiencesByFamily(experiences, "classic");
}

export function listEvidenceResultCapableExperiences(experiences) {
  return experiences.filter((experience) => {
    const descriptor = experience?.descriptor ?? experience;
    return descriptor?.capabilities?.evidenceResultCapable === true;
  });
}
