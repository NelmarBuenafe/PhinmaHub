/**
 * Progress is intentionally derived from persisted material completion records.
 * Opening a resource is not a completion event.
 */
export function hasSectionContent(content) {
  return typeof content === "string" && content.trim().length > 0;
}

export function deriveMaterialLearningProgress(sections = [], materials = [], progressRecords = [], readingRecords = []) {
  const progressByMaterial = new Map(
    progressRecords.map((record) => [record.material_id, record]),
  );
  const materialsBySection = new Map();
  const readingBySection = new Map(
    readingRecords.map((record) => [record.section_id, record]),
  );
  for (const material of materials) {
    materialsBySection.set(material.section_id, [
      ...(materialsBySection.get(material.section_id) || []),
      material,
    ]);
  }

  const sectionStates = new Map();
  const requiredSectionStates = [];
  const materialStates = new Map();
  for (const material of materials) {
    const record = progressByMaterial.get(material.id);
    materialStates.set(material.id, {
      isCompleted: record?.is_completed === true,
      completedAt: record?.completed_at || null,
      progressPercent: record?.progress_percent || 0,
      watchedRanges: record?.watched_ranges || [],
      lastPositionSeconds: record?.last_position_seconds || 0,
    });
  }

  for (const section of sections) {
    const requiredMaterials = (materialsBySection.get(section.id) || [])
      .filter((material) => material.is_required !== false);
    const completed = requiredMaterials.filter(
      (material) => materialStates.get(material.id)?.isCompleted,
    ).length;
    const contentIncluded = hasSectionContent(section.content);
    const readingWeight = contentIncluded ? (requiredMaterials.length ? 40 : 100) : 0;
    const materialsWeight = requiredMaterials.length ? (contentIncluded ? 60 : 100) : 0;
    const readingProgressPercent = Math.max(0, Math.min(100, readingBySection.get(section.id)?.progress_percent || 0));
    const materialProgressPercent = requiredMaterials.length
      ? (completed / requiredMaterials.length) * materialsWeight
      : 0;
    const progressPercent = Math.round((readingProgressPercent / 100) * readingWeight + materialProgressPercent);
    const affectsLesson = section.is_required !== false && (contentIncluded || requiredMaterials.length > 0);
    const state = {
      isCompleted: affectsLesson && progressPercent === 100,
      completedAt: null,
      progressPercent,
      isInformational: !affectsLesson,
      readingProgressPercent,
      readingWeight,
      materialsWeight,
    };
    sectionStates.set(section.id, state);
    if (affectsLesson) requiredSectionStates.push(state);
  }

  const lessonProgressPercent = requiredSectionStates.length
    ? Math.round(requiredSectionStates.reduce((sum, state) => sum + state.progressPercent, 0) / requiredSectionStates.length)
    : 0;
  return {
    lesson: {
      isCompleted: requiredSectionStates.length > 0 && requiredSectionStates.every((state) => state.isCompleted),
      completedAt: null,
      progressPercent: lessonProgressPercent,
      requiredSectionCount: requiredSectionStates.length,
      completedRequiredSectionCount: requiredSectionStates.filter((state) => state.isCompleted).length,
    },
    sectionStates,
    materialStates,
  };
}
