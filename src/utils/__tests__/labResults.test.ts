import { groupLabResults } from '../labResults';
import type { LabResult } from '../../services/api/reportsService';

let nextId = 1;
const result = (panel: string, subGroup: string | null, name: string): LabResult => ({
  id: nextId++,
  panel,
  subGroup,
  name,
  value: '1',
  unit: null,
  referenceText: null,
  referenceLow: null,
  referenceHigh: null,
  status: 'unknown',
});

describe('groupLabResults', () => {
  it('groups by panel then sub-group in report order', () => {
    const groups = groupLabResults([
      result('CBC', 'Red Blood Cells', 'Haemoglobin'),
      result('CBC', 'White Blood Cells', 'WBC'),
      result('Lipid Profile', null, 'Cholesterol'),
      result('CBC', 'Red Blood Cells', 'RBC'),
    ]);

    expect(
      groups.map((p) => ({
        panel: p.panel,
        subGroups: p.subGroups.map((s) => [s.subGroup, s.results.map((r) => r.name)]),
      })),
    ).toEqual([
      {
        panel: 'CBC',
        subGroups: [
          ['Red Blood Cells', ['Haemoglobin', 'RBC']],
          ['White Blood Cells', ['WBC']],
        ],
      },
      { panel: 'Lipid Profile', subGroups: [[null, ['Cholesterol']]] },
    ]);
  });

  it('returns no groups for no results', () => {
    expect(groupLabResults([])).toEqual([]);
  });
});
