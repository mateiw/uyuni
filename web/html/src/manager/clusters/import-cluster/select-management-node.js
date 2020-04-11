// @flow
import React, {useState, useEffect} from 'react';
import {Panel} from 'components/panels/Panel';
import {Button} from 'components/buttons';
import {Table} from 'components/table/Table';
import {Column} from 'components/table/Column';
import {SearchField} from 'components/table/SearchField';
import {SystemLink} from 'components/links';
import Functions from 'utils/functions';
import useClustersApi, {withErrorMessages} from '../shared/api/use-clusters-api';

import type {Message} from 'components/messages';
import type {ErrorMessagesType} from  '../shared/api/use-clusters-api';
import type {ServerType} from '../shared/api/use-clusters-api';

type Props = {
    provider: string,
    selectedNode: ?ServerType,
    onNext: (ServerType) => void,
    onPrev: () => void,
    setMessages: (Array<Message>) => void
};

const SelectManagementNode = (props: Props) => {
    const [selectedNodeId, setSelectedNodeId] = useState<?string>(props.selectedNode ? props.selectedNode.id.toString() : null);
    const [nodes, setNodes] = useState<Array<ServerType>>([]);
    const {fetchManagementNodes, fetching} = useClustersApi();

    useEffect(() => {
      fetchManagementNodes(props.provider).then(data => {
        setNodes(data);
      })
      .catch((error : ErrorMessagesType) => {
        props.setMessages(error.messages);
      });
    }, [])

    const filterFunc = (row, criteria) => {
        const keysToSearch = ['name'];
        if (criteria) {
            return keysToSearch.map(key => row[key]).join().toLowerCase().includes(criteria.toLowerCase());
        }
        return true;
    };

    const selectNode = (nodeId: ?string) => {
        if (nodeId) {
            const node = nodes.find(node => node.id.toString() === selectedNodeId);
            if (node) {
                props.onNext(node);
                return true;
            }
        }
        return false;
    }

    return (<Panel
                headingLevel="h4"
                title={t("Available management nodes")}
                footer={
                    <div className="btn-group">
                        <Button
                            id="btn-prev"
                            text={t("Prev")}
                            className="btn-default"
                            icon="fa-arrow-left"
                            handler={() => props.onPrev()}
                        />                      
                        <Button
                            id="btn-next"
                            disabled={!selectedNodeId}
                            text={t("Next")}
                            className="btn-success"
                            icon="fa-arrow-right"
                            handler={() => selectNode(selectedNodeId)}
                        />
                    </div>
                }>
                <Table
                    data={nodes}
                    loading={fetching}
                    identifier={row => row.id}
                    initialSortColumnKey="name"
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
                            <input type="radio" value={row.id} 
                                checked={selectedNodeId == row.id} 
                                onChange={(ev: SyntheticInputEvent<HTMLInputElement>) => setSelectedNodeId(ev.target.value)} />

                        }
                    />                    
                    <Column
                        columnKey="name"
                        width="97%"
                        comparator={Functions.Utils.sortByText}
                        header={t('Name')}
                        cell={row =>
                            <SystemLink id={row.id}>{row.name}</SystemLink>
                        }
                    />
                </Table>
            </Panel>
            );
}

export default withErrorMessages(SelectManagementNode);
