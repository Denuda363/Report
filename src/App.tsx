/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AppProvider } from './store/AppContext';
import { Layout } from './components/Layout';

export default function App() {
  return (
    <AppProvider>
      <Layout />
    </AppProvider>
  );
}
