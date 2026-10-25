import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { VisitsChart } from '../VisitsChart';
import {
  emptyHospitalForm,
  formatDuration,
  hospitalFieldErrors,
  hospitalToForm,
  parseHospitalForm,
} from '../../../services/api/adminSystemService';
import type { AdminHospital } from '../../../services/api/adminSystemService';
import { describeAudit } from '../../../services/api/adminService';
import type { AuditEntry } from '../../../services/api/adminService';

// Audit L2b step 3: hospitals and system health.

const valid = {
  ...emptyHospitalForm,
  name: '  Lakeside General Hospital ',
  address: '12 Lake Road, Dhaka',
  emergencyPhone: '+880 2-55165088',
};

describe('parseHospitalForm', () => {
  it('trims the text and sends empty coordinates as null', () => {
    const { input, errors } = parseHospitalForm(valid);
    expect(errors).toEqual({});
    expect(input).toEqual({
      name: 'Lakeside General Hospital',
      address: '12 Lake Road, Dhaka',
      emergency_phone: '+880 2-55165088',
      is_24_7: true,
      latitude: null,
      longitude: null,
    });
  });

  it('accepts a hotline and a full map pin', () => {
    const { input, errors } = parseHospitalForm({
      ...valid,
      emergencyPhone: '999',
      latitude: '23.7806',
      longitude: '90.4070',
    });
    expect(errors).toEqual({});
    expect([input.latitude, input.longitude]).toEqual([23.7806, 90.407]);
  });

  it('says what is wrong with each field', () => {
    const { errors } = parseHospitalForm({
      ...emptyHospitalForm,
      emergencyPhone: 'call us',
      latitude: '123',
      longitude: '',
    });
    expect(Object.keys(errors).sort()).toEqual([
      'address',
      'emergency_phone',
      'latitude',
      'longitude',
      'name',
    ]);
    expect(errors.latitude).toBe('Latitude is a number between -90 and 90.');
    expect(errors.longitude).toBe('Enter both latitude and longitude, or leave both empty.');
  });

  it('needs both halves of a map pin', () => {
    expect(parseHospitalForm({ ...valid, latitude: '23.78' }).errors).toEqual({
      longitude: 'Enter both latitude and longitude, or leave both empty.',
    });
    expect(parseHospitalForm({ ...valid, longitude: '90.4' }).errors).toEqual({
      latitude: 'Enter both latitude and longitude, or leave both empty.',
    });
  });

  it('treats the saved hospital as unchanged when the form is reopened', () => {
    const saved: AdminHospital = {
      id: 1,
      name: 'Lakeside General Hospital',
      address: '12 Lake Road, Dhaka',
      latitude: 23.7806,
      longitude: 90.407,
      emergencyPhone: '10666',
      is247: false,
      isActive: true,
      deactivatedAt: null,
      createdAt: null,
      updatedAt: null,
    };
    expect(parseHospitalForm(hospitalToForm(saved)).input).toEqual({
      name: saved.name,
      address: saved.address,
      emergency_phone: '10666',
      is_24_7: false,
      latitude: 23.7806,
      longitude: 90.407,
    });
  });
});

describe('hospitalFieldErrors', () => {
  it('takes the first server message for each known field', () => {
    const err = {
      status: 422,
      message: 'The given data was invalid.',
      errors: {
        name: ['A hospital with this name and address already exists.', 'second'],
        somethingElse: ['ignored'],
      },
    };
    expect(hospitalFieldErrors(err)).toEqual({
      name: 'A hospital with this name and address already exists.',
    });
  });

  it('returns nothing for a failure without field errors', () => {
    expect(hospitalFieldErrors(new Error('Network Error'))).toEqual({});
    expect(hospitalFieldErrors(null)).toEqual({});
  });
});

describe('formatDuration', () => {
  it('reads like a person would say it', () => {
    expect(formatDuration(null)).toBe('not measured');
    expect(formatDuration(850)).toBe('850 ms');
    expect(formatDuration(1234)).toBe('1.2 s');
  });
});

describe('describeAudit for step 3', () => {
  const entry = (
    action: string,
    target: AuditEntry['target'],
    meta: AuditEntry['meta'] = null,
  ): AuditEntry => ({ id: 1, action, admin: 'Admin One', target, reason: null, meta, at: '' });
  const hospital = { type: 'hospital' as const, id: 4, name: 'Lakeside' };

  it('names hospital, transcript and job actions', () => {
    expect(describeAudit(entry('hospital.created', hospital))).toBe('Added hospital Lakeside');
    expect(describeAudit(entry('hospital.deactivated', hospital))).toBe(
      'Hid hospital Lakeside from patients',
    );
    expect(describeAudit(entry('hospital.reactivated', hospital))).toBe(
      'Showed hospital Lakeside to patients again',
    );
    expect(
      describeAudit(entry('transcript.retried', { type: 'visit', id: 17, name: 'Visit #17' })),
    ).toBe('Retried the call transcript of Visit #17');
    expect(describeAudit(entry('job.discarded', null, { job: 'AnalyzeReportJob' }))).toBe(
      'Discarded failed job AnalyzeReportJob',
    );
  });
});

describe('VisitsChart unit', () => {
  it('counts whatever it is given, e.g. AI calls', async () => {
    await render(
      <VisitsChart
        days={[
          { date: '2026-10-24', total: 1 },
          { date: '2026-10-25', total: 3 },
        ]}
        unit={{ one: 'AI call', many: 'AI calls' }}
      />,
    );
    expect(screen.getByText(/AI calls on/)).toBeTruthy();
    expect(screen.getByLabelText(/^4 AI calls in the last 2 days/)).toBeTruthy();
  });
});
