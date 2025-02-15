/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { Severity } from './severity';
import userEvent from '@testing-library/user-event';
import { waitForEuiPopoverOpen } from '@elastic/eui/lib/test/rtl';
import { FormTestComponent } from '../../common/test_utils';

const onSubmit = jest.fn();

describe('Severity form field', () => {
  it('renders', async () => {
    render(
      <FormTestComponent onSubmit={onSubmit}>
        <Severity isLoading={false} />
      </FormTestComponent>
    );

    expect(await screen.findByTestId('caseSeverity')).toBeInTheDocument();
    expect(await screen.findByTestId('case-severity-selection')).toBeEnabled();
  });

  // default to LOW in this test configuration
  it('defaults to the correct value', async () => {
    render(
      <FormTestComponent onSubmit={onSubmit}>
        <Severity isLoading={false} />
      </FormTestComponent>
    );

    expect(await screen.findByTestId('caseSeverity')).toBeInTheDocument();
    expect(await screen.findByTestId('case-severity-selection-low')).toBeInTheDocument();
  });

  it('selects the correct value when changed', async () => {
    render(
      <FormTestComponent onSubmit={onSubmit}>
        <Severity isLoading={false} />
      </FormTestComponent>
    );

    expect(await screen.findByTestId('caseSeverity')).toBeInTheDocument();

    await userEvent.click(await screen.findByTestId('case-severity-selection'));
    await waitForEuiPopoverOpen();

    await userEvent.click(await screen.findByTestId('case-severity-selection-high'));

    await userEvent.click(await screen.findByTestId('form-test-component-submit-button'));

    await waitFor(() => {
      // data, isValid
      expect(onSubmit).toBeCalledWith({ severity: 'high' }, true);
    });
  });

  it('disables when loading data', async () => {
    render(
      <FormTestComponent onSubmit={onSubmit}>
        <Severity isLoading={true} />
      </FormTestComponent>
    );

    expect(await screen.findByTestId('case-severity-selection')).toBeDisabled();
  });
});
