/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import numeral from '@elastic/numeral';
import { render, screen } from '@testing-library/react';
import React from 'react';

import { EMPTY_STAT } from '../../../../helpers';
import { alertIndexWithAllResults } from '../../../../mock/pattern_rollup/mock_alerts_pattern_rollup';
import { auditbeatWithAllResults } from '../../../../mock/pattern_rollup/mock_auditbeat_pattern_rollup';
import { packetbeatNoResults } from '../../../../mock/pattern_rollup/mock_packetbeat_pattern_rollup';
import {
  TestDataQualityProviders,
  TestExternalProviders,
} from '../../../../mock/test_providers/test_providers';
import { PatternRollup } from '../../../../types';
import { Props, StorageDetails } from '.';

const defaultBytesFormat = '0,0.[0]b';
const formatBytes = (value: number | undefined) =>
  value != null ? numeral(value).format(defaultBytesFormat) : EMPTY_STAT;

const defaultNumberFormat = '0,0.[000]';
const formatNumber = (value: number | undefined) =>
  value != null ? numeral(value).format(defaultNumberFormat) : EMPTY_STAT;

const ilmPhases = ['hot', 'warm', 'unmanaged'];
const patterns = ['.alerts-security.alerts-default', 'auditbeat-*', 'packetbeat-*'];

const patternRollups: Record<string, PatternRollup> = {
  '.alerts-security.alerts-default': alertIndexWithAllResults,
  'auditbeat-*': auditbeatWithAllResults,
  'packetbeat-*': packetbeatNoResults,
};

const onIndexSelected = jest.fn();

const defaultProps: Props = {
  onIndexSelected,
};

describe('StorageDetails', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    render(
      <TestExternalProviders>
        <TestDataQualityProviders
          dataQualityContextProps={{ ilmPhases, patterns, formatBytes, formatNumber }}
          resultsRollupContextProps={{ patternRollups }}
        >
          <StorageDetails {...defaultProps} />
        </TestDataQualityProviders>
      </TestExternalProviders>
    );
  });

  test('it renders the treemap', () => {
    expect(screen.getByTestId('storageTreemap').querySelector('.echChart')).toBeInTheDocument();
  });
});
