// @flow
import React, {useState, useEffect} from 'react';
import {Panel} from 'components/panels/Panel';
import {Button} from 'components/buttons';
import {Table} from 'components/table/Table';
import {Column} from 'components/table/Column';
import {SearchField} from 'components/table/SearchField';
import {SystemLink} from 'components/links';
import Functions from 'utils/functions';
import useClustersApi, {withErrorMessages} from '../api/use-clusters-api';

import type {Message} from 'components/messages';
import type {ErrorMessagesType, ServerType} from  '../api/use-clusters-api';

type Props = {
    title: string,
    selectedServer: ?ServerType,
    onNext: (ServerType) => void,
    onPrev?: () => void,
    setMessages: (Array<Message>) => void,
    fetchServers: () => Promise<Array<ServerType>>
};

const SelectServer = (props: Props) => {
    const [selectedServerId, setSelectedServerId] = useState<?string>(props.selectedServer ? props.selectedServer.id.toString() : null);
    const [servers, setServers] = useState<Array<ServerType>>([]);
    const [fetching, setFetching] = useState<boolean>(false);

    useEffect(() => {
        setFetching(true);
        props.fetchServers().then(data => {
            setServers(data);
        })
        .catch((error : ErrorMessagesType) => {
            props.setMessages(error.messages);
        })
        .finally(() => {
            setFetching(false);
        });
    }, [])

    const filterFunc = (row, criteria) => {
        const keysToSearch = ['name'];
        if (criteria) {
            return keysToSearch.map(key => row[key]).join().toLowerCase().includes(criteria.toLowerCase());
        }
        return true;
    };

    const selectServer = (serverId: ?string) => {
        if (serverId) {
            const server = servers.find(srv => srv.id.toString() === selectedServerId);
            if (server) {
                props.onNext(server);
                return true;
            }
        }
        return false;
    }

    return (<Panel
                headingLevel="h4"
                title={props.title}
                footer={
                    <div className="btn-group">
                        {props.onPrev ? <Button
                            id="btn-prev"
                            text={t("Prev")}
                            className="btn-default"
                            icon="fa-arrow-left"
                            handler={() => props.onPrev()} /> : null}
                        <Button
                            id="btn-next"
                            disabled={!selectedServerId}
                            text={t("Next")}
                            className="btn-success"
                            icon="fa-arrow-right"
                            handler={() => selectServer(selectedServerId)}
                        />
                    </div>
                }>
                <Table
                    data={servers}
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
                                checked={selectedServerId == row.id} 
                                onChange={(ev: SyntheticInputEvent<HTMLInputElement>) => setSelectedServerId(ev.target.value)} />

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

export default withErrorMessages(SelectServer);
