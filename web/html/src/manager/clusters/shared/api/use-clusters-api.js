// @flow
import {useState} from 'react';
import * as Network from 'utils/network';

import type {JsonResult} from "utils/network";

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

// type ClustersListResultType = {
//     clusters: Array<ClusterType>,
//     messages: {[string]: string}
// }

type ClusterNodesResultType = {
    nodes: Array<ClusterNodeType>,
    messages: {[string]: string}
}

const useClustersApi = ()  => {
    const [clusterId, setClusterId] = useState<number>(0);

    const [nodes, setNodes] = useState<Array<ClusterNodeType>>([]);
    const [messages, setMessages] = useState<Array<Object>>([]);
    const [fetching, setFetching] = useState<boolean>(false);

    const handleResponseError = (jqXHR: Object, arg: string = ""): any => {
      const msg = Network.responseErrorMessage(jqXHR);
      setMessages(msg);
      return [];
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
                setClusterId(id);
                setNodes(data.data);
                // setMessages(data.data.messages);
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


    return {
        // fetchClustersList,
        nodes,
        messages,
        fetchClusterNodes,
        fetchFormulaData,
        fetchManagementNodes,
        fetching
    }
}

export default useClustersApi;
