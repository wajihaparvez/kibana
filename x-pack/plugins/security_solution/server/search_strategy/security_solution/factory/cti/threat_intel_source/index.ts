/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { IEsSearchResponse } from '@kbn/search-types';
import type { SecuritySolutionFactory } from '../../types';
import type {
  CtiDataSourceStrategyResponse,
  CtiQueries,
} from '../../../../../../common/search_strategy/security_solution/cti';
import { inspectStringifyObject } from '../../../../../utils/build_query';
import { buildTiDataSourceQuery } from './query.threat_intel_source.dsl';

export const dataSource: SecuritySolutionFactory<CtiQueries.dataSource> = {
  buildDsl: (options) => buildTiDataSourceQuery(options),
  parse: async (
    options,
    response: IEsSearchResponse<unknown>
  ): Promise<CtiDataSourceStrategyResponse> => {
    const inspect = {
      dsl: [inspectStringifyObject(buildTiDataSourceQuery(options))],
    };

    return {
      ...response,
      inspect,
    };
  },
};
