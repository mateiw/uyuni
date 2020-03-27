// @flow
import { hot } from 'react-hot-loader';
import withPageWrapper from 'components/general/with-page-wrapper';
import React, {useEffect} from 'react';
import {TopPanel} from 'components/panels/TopPanel';
import {Panel} from 'components/panels/Panel';
import {PanelRow} from 'components/panels/PanelRow';
import {Label} from 'components/input/Label'; 
import {SystemLink} from 'components/links';
import {Table} from 'components/table/Table';
import {Column} from 'components/table/Column';
import Functions from 'utils/functions';
import {SearchField} from 'components/table/SearchField';
import {AsyncButton} from 'components/buttons';

import useClustersApi from '../shared/api/use-clusters-api';
import type {ClusterType} from '../shared/api/use-clusters-api';

type Props = {
  cluster: ClusterType,
  flashMessage: String,
};

const Cluster = (props: Props) => {

    const {nodes, fetchClusterNodes, fetching} = useClustersApi();

    useEffect(() => {
      fetchClusterNodes(props.cluster.id);
    }, []);

    const filterFunc = (row, criteria) => {
        const keysToSearch = ['hostname'];
        if (criteria) {
            return keysToSearch.map(key => row[key]).join().toLowerCase().includes(criteria.toLowerCase());
        }
        return true;
    };

    const panelButtons = (
        <div className="pull-right btn-group">
            <AsyncButton id="enable-monitoring-btn" defaultType="btn-success"
              icon="fa-refresh"
              text={ t("Refresh") }
              className="gap-right"
              action={() => fetchClusterNodes(props.cluster.id)}/>
        </div>
    );

    return (
      <React.Fragment>
        <TopPanel title={props.cluster.name}
            button={panelButtons}
            icon="spacewalk-icon-cluster"
            helpUrl="/docs/reference/clusters/clusters-menu.html">
            
            <Panel headingLevel="h2" title={t('Cluster Properties')}>
              <PanelRow>
                <Label name={t('Name')} className='col-md-3'/>
                <div className='col-md-6'>{props.cluster.name}</div>
              </PanelRow>
              <PanelRow>
                <Label name={t('Type')} className='col-md-3'/>
                <div className='col-md-6'>{props.cluster.type.name}</div>
              </PanelRow>
              <PanelRow>
                <Label name={t('Management node')} className='col-md-3'/>
                <SystemLink id={props.cluster.managementNode.id} className='col-md-6'>{props.cluster.managementNode.name}</SystemLink>
              </PanelRow> 
            </Panel>
        </TopPanel>

        <Table
            data={nodes}
            loading={fetching}
            identifier={row => row.hostname}
            initialSortColumnKey="hostname"
            searchField={(
                <SearchField
                filter={filterFunc}
                placeholder={t('Filter by any value')}
                />
            )}>
            <Column
                columnKey="hostname"
                comparator={Functions.Utils.sortByText}
                header={t('Hostname')}
                cell={row => row.hostname }
            />
        </Table>
      </React.Fragment>);
}

export default hot(module)(withPageWrapper<Props>(Cluster));