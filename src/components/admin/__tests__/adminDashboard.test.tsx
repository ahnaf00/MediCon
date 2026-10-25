import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { VisitsChart } from '../VisitsChart';
import { statusBadge } from '../accountStatus';
import { describeAudit, timeAgo } from '../../../services/api/adminService';
import type { AuditEntry } from '../../../services/api/adminService';

// Audit L2b step 1: helpers and the Overview chart.

describe('timeAgo', () => {
  const now = new Date('2026-10-25T12:00:00Z');

  it('reads like a person would say it', () => {
    expect(timeAgo(null, now)).toBe('never');
    expect(timeAgo('2026-10-25T11:59:40Z', now)).toBe('just now');
    expect(timeAgo('2026-10-25T11:45:00Z', now)).toBe('15 min ago');
    expect(timeAgo('2026-10-25T07:00:00Z', now)).toBe('5 h ago');
    expect(timeAgo('2026-10-24T10:00:00Z', now)).toBe('yesterday');
    expect(timeAgo('2026-10-21T12:00:00Z', now)).toBe('4 days ago');
    expect(timeAgo('2026-09-01T12:00:00Z', now)).not.toMatch(/ago/);
  });
});

describe('describeAudit', () => {
  const entry = (action: string, name: string | null): AuditEntry => ({
    id: 1,
    action,
    admin: 'Admin One',
    target: name ? { id: 9, name } : null,
    reason: null,
    meta: null,
    at: '2026-10-25T12:00:00Z',
  });

  it('names the action and the account', () => {
    expect(describeAudit(entry('user.suspended', 'Rahat Ahmed'))).toBe('Suspended Rahat Ahmed');
    expect(describeAudit(entry('user.reactivated', 'Rahat Ahmed'))).toBe('Reactivated Rahat Ahmed');
    expect(describeAudit(entry('doctor.approved', 'Dr. New'))).toBe('Approved doctor Dr. New');
    expect(describeAudit(entry('doctor.rejected', null))).toBe('Rejected doctor an account');
  });
});

describe('statusBadge', () => {
  it('shows nothing for an active account and a word otherwise', () => {
    expect(statusBadge({ status: 'active', deletedAt: null })).toBeNull();
    expect(statusBadge({ status: 'suspended', deletedAt: null })?.label).toBe('Suspended');
    expect(statusBadge({ status: 'pending', deletedAt: null })?.label).toBe('Pending');
    // A deleted account reads as deleted whatever its old status was.
    expect(statusBadge({ status: 'suspended', deletedAt: '2026-10-20T00:00:00Z' })?.label).toBe(
      'Deleted',
    );
  });
});

describe('VisitsChart', () => {
  const days = Array.from({ length: 14 }, (_, i) => ({
    date: `2026-10-${String(12 + i).padStart(2, '0')}`,
    total: i === 13 ? 3 : i === 5 ? 1 : 0,
  }));

  it('starts on today and tells screen readers every day', async () => {
    await render(<VisitsChart days={days} />);

    expect(screen.getByText(/^visits on .*25/)).toBeTruthy();
    expect(
      screen.getByLabelText(/^4 visits in the last 14 days\. .*(25 Oct|Oct 25): 3\.$/),
    ).toBeTruthy();
    expect(screen.getAllByRole('button')).toHaveLength(14);
  });

  it('shows the tapped day', async () => {
    await render(<VisitsChart days={days} />);

    await fireEvent.press(screen.getByLabelText(/(17 Oct|Oct 17): 1 visit$/));

    expect(screen.getByText(/^visit on .*17/)).toBeTruthy();
  });

  it('draws nothing without data', async () => {
    await render(<VisitsChart days={[]} />);
    expect(screen.toJSON()).toBeNull();
  });
});
