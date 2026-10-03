import type { LabResult } from '../services/api/reportsService';

export interface LabResultSubGroup {
  /** null when the report prints no sub-heading for these rows. */
  subGroup: string | null;
  results: LabResult[];
}

export interface LabResultPanel {
  panel: string;
  subGroups: LabResultSubGroup[];
}

/**
 * Groups extracted results by panel, then sub-group, keeping the order in
 * which they appear on the report.
 */
export function groupLabResults(results: LabResult[]): LabResultPanel[] {
  const panels: LabResultPanel[] = [];

  for (const result of results) {
    let panel = panels.find((p) => p.panel === result.panel);
    if (!panel) {
      panel = { panel: result.panel, subGroups: [] };
      panels.push(panel);
    }

    let subGroup = panel.subGroups.find((s) => s.subGroup === result.subGroup);
    if (!subGroup) {
      subGroup = { subGroup: result.subGroup, results: [] };
      panel.subGroups.push(subGroup);
    }

    subGroup.results.push(result);
  }

  return panels;
}
