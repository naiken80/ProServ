import { render } from '@testing-library/react';

import { Button } from '../src/components/ui/button';

describe('UI primitives', () => {
  it('renders button variants without crashing', () => {
    const { getByRole } = render(<Button>Primary action</Button>);
    expect(getByRole('button')).toHaveTextContent('Primary action');
  });
});
