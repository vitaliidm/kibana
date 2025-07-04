/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';
import { EuiCallOut, EuiLink } from '@elastic/eui';
import { i18n } from '@kbn/i18n';
import { FormattedMessage } from '@kbn/i18n-react';
import { Legacy } from '../../legacy_shims';
import { Monospace } from '../metricbeat_migration/instruction_steps/components/monospace/monospace';

export interface IReason {
  indexPatternExists?: boolean;
  indexPatternInTimeRangeExists?: boolean;
  typeExists?: boolean;
  typeExistsAtAnyTime?: boolean;
  usingStructuredLogs?: boolean;
  clusterExists?: boolean;
  nodeExists?: boolean | null;
  indexExists?: boolean;
  correctIndexName?: boolean;
}

export const Reason = ({ reason }: { reason?: IReason }) => {
  const filebeatUrl = Legacy.shims.docLinks.links.filebeat.installation;
  const elasticsearchUrl = Legacy.shims.docLinks.links.filebeat.elasticsearchModule;
  const troubleshootUrl = Legacy.shims.docLinks.links.monitoring.troubleshootKibana;
  let title = i18n.translate('xpack.monitoring.logs.reason.defaultTitle', {
    defaultMessage: 'No log data found',
  });
  let message = (
    <FormattedMessage
      id="xpack.monitoring.logs.reason.defaultMessage"
      defaultMessage="We did not find any log data and we are unable to diagnose why. {link}"
      values={{
        link: (
          <EuiLink target="_blank" href={filebeatUrl}>
            <FormattedMessage
              id="xpack.monitoring.logs.reason.defaultMessageLink"
              defaultMessage="Please verify your setup is correct."
            />
          </EuiLink>
        ),
      }}
    />
  );

  if (false === reason?.indexPatternExists) {
    title = i18n.translate('xpack.monitoring.logs.reason.noIndexPatternTitle', {
      defaultMessage: 'No log data found',
    });
    message = (
      <FormattedMessage
        id="xpack.monitoring.logs.reason.noIndexPatternMessage"
        defaultMessage="Set up {link}, then configure your Elasticsearch output to your monitoring cluster."
        values={{
          link: (
            <EuiLink target="_blank" href={filebeatUrl}>
              {i18n.translate('xpack.monitoring.logs.reason.noIndexPatternLink', {
                defaultMessage: 'Filebeat',
              })}
            </EuiLink>
          ),
        }}
      />
    );
  } else if (
    false === reason?.indexPatternInTimeRangeExists ||
    (false === reason?.typeExists && reason.typeExistsAtAnyTime)
  ) {
    title = i18n.translate('xpack.monitoring.logs.reason.noIndexPatternInTimePeriodTitle', {
      defaultMessage: 'No logs for the selected time',
    });
    message = (
      <FormattedMessage
        id="xpack.monitoring.logs.reason.noIndexPatternInTimePeriodMessage"
        defaultMessage="Use the time filter to adjust your timeframe."
      />
    );
  } else if (false === reason?.typeExists) {
    title = i18n.translate('xpack.monitoring.logs.reason.noTypeTitle', {
      defaultMessage: 'No logs for Elasticsearch',
    });
    message = (
      <FormattedMessage
        id="xpack.monitoring.logs.reason.noTypeMessage"
        defaultMessage="Follow {link} to set up Elasticsearch."
        values={{
          link: (
            <EuiLink target="_blank" href={elasticsearchUrl}>
              {i18n.translate('xpack.monitoring.logs.reason.noTypeLink', {
                defaultMessage: 'these directions',
              })}
            </EuiLink>
          ),
        }}
      />
    );
  } else if (false === reason?.usingStructuredLogs) {
    title = i18n.translate('xpack.monitoring.logs.reason.notUsingStructuredLogsTitle', {
      defaultMessage: 'No structured logs found',
    });
    message = (
      <FormattedMessage
        id="xpack.monitoring.logs.reason.notUsingStructuredLogsMessage"
        defaultMessage="Check if the {varPaths} setting {link}."
        values={{
          varPaths: <Monospace>var.paths</Monospace>,
          link: (
            <EuiLink target="_blank" href={elasticsearchUrl}>
              {i18n.translate('xpack.monitoring.logs.reason.notUsingStructuredLogsLink', {
                defaultMessage: 'points to JSON logs',
              })}
            </EuiLink>
          ),
        }}
      />
    );
  } else if (false === reason?.clusterExists) {
    title = i18n.translate('xpack.monitoring.logs.reason.noClusterTitle', {
      defaultMessage: 'No logs for this cluster',
    });
    message = (
      <FormattedMessage
        id="xpack.monitoring.logs.reason.noClusterMessage"
        defaultMessage="Check that your {link} is correct."
        values={{
          link: (
            <EuiLink target="_blank" href={elasticsearchUrl}>
              {i18n.translate('xpack.monitoring.logs.reason.noClusterLink', {
                defaultMessage: 'setup',
              })}
            </EuiLink>
          ),
        }}
      />
    );
  } else if (false === reason?.nodeExists) {
    title = i18n.translate('xpack.monitoring.logs.reason.noNodeTitle', {
      defaultMessage: 'No logs for this Elasticsearch node',
    });
    message = (
      <FormattedMessage
        id="xpack.monitoring.logs.reason.noNodeMessage"
        defaultMessage="Check that your {link} is correct."
        values={{
          link: (
            <EuiLink target="_blank" href={elasticsearchUrl}>
              {i18n.translate('xpack.monitoring.logs.reason.noNodeLink', {
                defaultMessage: 'setup',
              })}
            </EuiLink>
          ),
        }}
      />
    );
  } else if (false === reason?.indexExists) {
    title = i18n.translate('xpack.monitoring.logs.reason.noIndexTitle', {
      defaultMessage: 'No logs for this index',
    });
    message = (
      <FormattedMessage
        id="xpack.monitoring.logs.reason.noIndexMessage"
        defaultMessage="We found logs, but none for this index. If this problem continues, check that your {link} is correct."
        values={{
          link: (
            <EuiLink target="_blank" href={elasticsearchUrl}>
              {i18n.translate('xpack.monitoring.logs.reason.noIndexLink', {
                defaultMessage: 'setup',
              })}
            </EuiLink>
          ),
        }}
      />
    );
  } else if (false === reason?.correctIndexName) {
    title = i18n.translate('xpack.monitoring.logs.reason.correctIndexNameTitle', {
      defaultMessage: 'Corrupted filebeat index',
    });
    message = (
      <FormattedMessage
        id="xpack.monitoring.logs.reason.correctIndexNameMessage"
        defaultMessage="There is an issue reading from your filebeat indices.  {link}."
        values={{
          link: (
            <EuiLink target="_blank" href={troubleshootUrl}>
              {i18n.translate('xpack.monitoring.logs.reason.correctIndexNameLink', {
                defaultMessage: 'Click here for more information',
              })}
            </EuiLink>
          ),
        }}
      />
    );
  }

  return (
    <EuiCallOut title={title} color="warning" iconType="question">
      <p>{message}</p>
    </EuiCallOut>
  );
};
