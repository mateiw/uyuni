// @flow
import * as React from 'react';
import {useState} from 'react';
import * as Network from 'utils/network';
import {Messages} from 'components/messages';

import type {JsonResult} from "utils/network";
import type {Message} from 'components/messages';

// TODO move this to FormulaComponentGenerator when flowified
export type FormulaValuesType = {[string]: any};

export type ClusterTypeType = {
    id: number,
    label: string,
    name: string,
    description: string
}

export type ServerType = {
    id: number, 
    name: string
}

export type ClusterType = {
    id: number,
    name: string,
    type: ClusterTypeType,
    managementNode: ServerType
}

export type ClusterNodeType = {
    hostname: string
}

// type ClusterNodesResultType = {
//     nodes: Array<ClusterNodeType>,
//     messages: {[string]: string}
// }

export type ErrorMessagesType = {
    messages: Array<Message>
}

export class ErrorMessages extends Error {

    messages = [];

    constructor(messages: Array<Message>) {
        super(messages.map((msg) => msg.text).join(" "));
        this.messages = messages;
    }
}

type Props = {}
type State = {
    messages: Array<Message>
}

export const withErrorMessages = (PageComponent: React.AbstractComponent<any>) => {

    return class extends React.Component<Props, State> {
        constructor(props: Props) {
            super(props);
            this.state = {
                messages: []
            }
        }

        render() {
            return <React.Fragment>
                    <Messages items={this.state.messages}/>
                    <PageComponent setMessages={(messages) => this.setState({messages: messages})} {...this.props}/>
                </React.Fragment>
        }
    };
}

const useClustersApi = ()  => {
    const [fetching, setFetching] = useState<boolean>(false);

    const handleResponseError = (jqXHR: Object, arg: string = "") => {
        throw new ErrorMessages(Network.responseErrorMessage(jqXHR));
    };

    // const fetchClustersList = () : Promise<Array<ClusterType>> => {
    //     return Network.get("/rhn/manager/api/clusters").promise
    //         .then((data: JsonResult<ClustersListResultType>) => {
    //             setClusters(data.data.clusters);
    //             setClustersMessages(data.data.messages);
    //             return data.data.clusters;
    //         })
    //         .catch(handleResponseError)
    //         .finally(() => {
    //             setFetching(false);
    //         });
    // }

    const fetchClusterNodes = (id: number) : Promise<Array<ClusterNodeType>> => {
        setFetching(true);
        return Network.get(`/rhn/manager/api/cluster/${id}/nodes`).promise
            .then((data: JsonResult<Array<ClusterNodeType>>) => {
                return data.data;
            })
            .catch(handleResponseError)
            .finally(() => {
                setFetching(false);
            });
    }

    const fetchManagementNodes = (provider: string) : Promise<Array<ServerType>> => {
        setFetching(true);
        return Network.get(`/rhn/manager/api/cluster/provider/${provider}/nodes`).promise
            .then((data: JsonResult<Array<ServerType>>) => {
                return data.data;
            })
            .catch(handleResponseError)
            .finally(() => {
                setFetching(false);
            });
    }    

    const fetchFormulaData = (provider: string) : Promise<any> => {
        setFetching(true);
        return Network.get(`/rhn/manager/api/cluster/import/${provider}/formula`).promise
            .then((data: JsonResult<any>) => {
                return Promise.resolve({
                    "formula_name": provider,
                    "formula_list": [],
                    "metadata": {},
                    ...data.data
                    });
            })
            .catch(handleResponseError)
            .finally(() => {
                setFetching(false);
            });            
    }

    const startImport = (providerLabel: string, managementNodeId: number, providerConfig: FormulaValuesType, earliest: Date, actionChain: ?string) : Promise<number> => {
        setFetching(true);
        return Network.post(
            "/rhn/manager/api/cluster/import",
            JSON.stringify({
                earliest: earliest,
                provider: providerLabel,
                managementNodeId: managementNodeId,
                providerConfig: providerConfig
            }),
            "application/json"
        ).promise
        .then((data: JsonResult<number>) => {
            return data.data
        })
        .catch(handleResponseError)
        .finally(() => {
            setFetching(false);
        });     
    }

    return {
        fetchClusterNodes,
        fetchFormulaData,
        fetchManagementNodes,
        fetching,
        startImport
    }
}

export default useClustersApi;
