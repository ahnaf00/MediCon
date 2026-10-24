import { stripHeading } from '../MedicineLabelView';

describe('stripHeading', () => {
  it.each([
    ['Purpose Pain reliever/fever reducer', 'Pain reliever/fever reducer'],
    ['Warnings Allergy alert: may cause', 'Allergy alert: may cause'],
    ['INDICATIONS AND USAGE: For pain.', 'For pain.'],
    ['Warnings and cautions - Take care', 'Take care'],
    ['Pain reliever', 'Pain reliever'],
  ])('%s', (input, expected) => {
    expect(stripHeading(input)).toBe(expected);
  });
});
