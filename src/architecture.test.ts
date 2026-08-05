// This test asserts that all path aliases configured in babel.config.js and tsconfig.json resolve correctly.

import '@components';
import '@components/ui';
import '@components/forms';
import '@components/cards';
import '@components/medical';
import '@components/layouts';
import '@components/navigation';

import '@hooks';
import '@store';

import '@services';
import '@services/api';
import '@services/ai';
import '@services/storage';
import '@services/notifications';
import '@services/protocols';

import '@utils';
import '@constants';
import '@types';
import '@theme';

describe('Architecture Scaffolding', () => {
  it('Should successfully resolve all alias imports without throwing', () => {
    // If the imports above fail, Jest will fail to run the suite.
    // If it reaches here, the path aliases are correctly configured and pointing to existing index files.
    expect(true).toBe(true);
  });
});
