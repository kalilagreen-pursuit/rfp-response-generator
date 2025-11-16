import type { ProjectPhase } from '../types';

export const parseTimelineDurationInWeeks = (timeline: string): number => {
  if (!timeline) return 4; // Default duration
  
  // This regex finds patterns like (4-6 weeks) or (8 weeks)
  const regex = /\((\d+)-?(\d+)?\s+weeks?\)/g;
  let totalWeeks = 0;
  let match;

  while ((match = regex.exec(timeline)) !== null) {
    // match[2] is the high estimate if it exists (e.g., the '6' in '4-6')
    // match[1] is the low estimate, or the only estimate (e.g., the '8' in '8 weeks')
    const weeks = match[2] ? parseInt(match[2], 10) : parseInt(match[1], 10);
    if (!isNaN(weeks)) {
      totalWeeks += weeks;
    }
  }
  
  // If parsing fails or results in 0, return a default duration
  return totalWeeks > 0 ? totalWeeks : 4;
};


// This regex can handle "Phase X: Name (Y weeks)" or "Phase X: Name (Y-Z weeks)"
const phaseRegex = /Phase\s*\d+:\s*(.*?)\s*\((\d+)-?(\d+)?\s+weeks?\)/gi;

export const parseTimelineStringToPhases = (timeline: string, projectStartDate: string): ProjectPhase[] => {
    const phases: ProjectPhase[] = [];
    if (!timeline || !projectStartDate) return phases;
    
    // Reset regex state before use to ensure correct parsing every time.
    phaseRegex.lastIndex = 0;
    
    let lastEndDate = new Date(projectStartDate);
    let match;

    // eslint-disable-next-line no-cond-assign
    while ((match = phaseRegex.exec(timeline)) !== null) {
        const name = match[1].trim().replace(/,$/, ''); // Also remove trailing commas
        const lowWeeks = parseInt(match[2], 10);
        // Use high-end estimate for duration, fallback to low-end
        const highWeeks = match[3] ? parseInt(match[3], 10) : lowWeeks;
        const durationWeeks = isNaN(highWeeks) ? (isNaN(lowWeeks) ? 2 : lowWeeks) : highWeeks;

        const startDate = new Date(lastEndDate);
        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + durationWeeks * 7);

        phases.push({
            name,
            durationWeeks,
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
        });

        lastEndDate = endDate;
    }
    
    // Fallback if regex fails to find any phases
    if (phases.length === 0) {
        const totalDuration = parseTimelineDurationInWeeks(timeline);
        const startDate = new Date(projectStartDate);
        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + totalDuration * 7);
        phases.push({
            name: "Project Execution",
            durationWeeks: totalDuration,
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString()
        });
    }

    return phases;
};


export const calculateProjectDatesAndPhases = (generatedDate: string, timeline: string): { startDate: string; endDate:string; phases: ProjectPhase[] } => {
    const startDate = new Date(generatedDate).toISOString();
    const phases = parseTimelineStringToPhases(timeline, startDate);
    
    // The overall end date is the end date of the last phase
    const endDate = phases.length > 0 ? phases[phases.length - 1].endDate : new Date(startDate).toISOString();
    
    return { startDate, endDate, phases };
};