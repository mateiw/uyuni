// @flow
import * as React from 'react';
import {useEffect, useState} from 'react';
import useClustersApi from '../shared/api/use-clusters-api';
import {AsyncButton, LinkButton, Button} from 'components/buttons';
import {SystemLink} from 'components/links';
import {Table} from 'components/table/Table';
import {Column} from 'components/table/Column';
import Functions from 'utils/functions';
import {SearchField} from 'components/table/SearchField';
import {Panel} from 'components/panels/Panel';
import {PanelRow} from 'components/panels/PanelRow';
import {SectionToolbar} from 'components/section-toolbar/section-toolbar';
import {Label} from 'components/input/Label'; 

import type {ClusterType, ClusterNodeType, ErrorMessagesType} from '../shared/api/use-clusters-api'
import type {Message} from 'components/messages';

type Props = {
  cluster: ClusterType,
  setMessages: (Array<Message>) => void
};

const ClusterOverview = (props: Props) => {
  const [selectedNode, setSelectedNode] = useState<?string>(null);
  const [nodes, setNodes] = useState<Array<ClusterNodeType>>([]);
  const [fetching, setFetching] = useState<boolean>(false);
  const {fetchClusterNodes} = useClustersApi();

  const fetchData = () => {
    setFetching(true);
    fetchClusterNodes(props.cluster.id)
    .then((nodes) => setNodes(nodes))
    .catch((error : ErrorMessagesType) => {
      props.setMessages(error.messages);
    })
    .finally((fetching) => setFetching(false));
  }

  useEffect(() => {
    fetchData();
  }, []);

  const onRemove = () => {
    if (selectedNode) {
      window.location.replace(`/rhn/manager/cluster/${props.cluster.id}/remove/${selectedNode}`);
    }
  }

  const filterFunc = (row, criteria) => {
      const keysToSearch = ['hostname'];
      if (criteria) {
          return keysToSearch.map(key => row[key]).join().toLowerCase().includes(criteria.toLowerCase());
      }
      return true;
  };

  return (
      <React.Fragment>
        <SectionToolbar>
          <div className="pull-right btn-group">
              <LinkButton
                id="join-btn" 
                icon="fa-plus"
                text={t("Join Node")}
                className="gap-right btn-default"
                href={`/rhn/manager/cluster/${props.cluster.id}/join`}
                />
              <Button
                id="remove-btn" 
                disabled={!selectedNode}
                icon="fa-minus"
                text={t("Remove Node")}
                className="gap-right btn-default"
                handler={onRemove}
                />              
              <AsyncButton id="refresh-btn" defaultType="btn-default"
                icon="fa-refresh"
                text={ t("Refresh") }
                className="gap-right"
                action={() => {fetchData(); setSelectedNode(null);}}/>
          </div>
        </SectionToolbar>    

        <Panel headingLevel="h3" title={t('Cluster Properties')}>
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
                columnKey="select"
                header={''}
                cell={row =>
                     <input type="radio" value={row.hostname} 
                        checked={selectedNode == row.hostname} 
                        onChange={(ev: SyntheticInputEvent<HTMLInputElement>) => setSelectedNode(ev.target.value)} />
                }
            />                 
            <Column
                columnKey="hostname"
                width="97%"                
                comparator={Functions.Utils.sortByText}
                header={t('Hostname')}
                cell={row => row.hostname }
            />
        </Table>
      </React.Fragment>
    );
}

export default ClusterOverview;