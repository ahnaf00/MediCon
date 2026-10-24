import React from 'react';
import { Text } from 'react-native';
import { fireEvent, screen } from '@testing-library/react-native';
import { Slot } from 'expo-router';
import { renderRouter } from 'expo-router/testing-library';

jest.mock('@livekit/react-native', () => ({ registerGlobals: jest.fn() }));
jest.mock('../store', () => {
  const persist = { hasHydrated: () => true, onFinishHydration: () => () => {} };
  const auth = Object.assign((sel: (s: object) => unknown) => sel({ token: 'tok' }), {
    persist,
    getState: () => ({ token: 'tok' }),
  });
  const onboarding = Object.assign(
    (sel: (s: object) => unknown) => sel({ hasSeenOnboarding: true }),
    { persist },
  );
  return { useAuthStore: auth, useOnboardingStore: onboarding };
});

// eslint-disable-next-line @typescript-eslint/no-require-imports
const RootLayout = require('../../app/_layout');

let shouldCrash = true;
function Screen() {
  if (shouldCrash) throw new Error('boom: secret stack detail');
  return <Text>Screen works</Text>;
}

describe('root ErrorBoundary (audit E5)', () => {
  beforeEach(() => jest.spyOn(console, 'error').mockImplementation(() => {}));
  afterEach(() => jest.restoreAllMocks());

  it('shows a friendly screen instead of crashing, and Retry recovers', async () => {
    shouldCrash = true;
    await renderRouter(
      { _layout: RootLayout, '(app)/_layout': { default: () => <Slot /> }, '(app)/index': Screen },
      { initialUrl: '/' },
    );

    expect(await screen.findByText(/Something went wrong on this screen/)).toBeTruthy();
    expect(screen.queryByText(/secret stack detail/)).toBeNull();

    shouldCrash = false;
    fireEvent.press(screen.getByText('Retry'));
    expect(await screen.findByText('Screen works')).toBeTruthy();
  });
});
