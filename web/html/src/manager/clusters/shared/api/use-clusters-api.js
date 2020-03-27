// @flow
import {useState} from 'react';
import * as Network from 'utils/network';

import type {JsonResult} from "utils/network";

export type ClusterTypeType = {
    id: number,
    name: string
}

export type Server = {
    id: number, 
    name: string
}

export type ClusterType = {
    id: number,
    name: string,
    type: ClusterTypeType,
    managementNode: Server
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
    // const [clusters, setClusters] = useState<Array<ClusterType>>([]);
    const [clusterId, setClusterId] = useState<number>(0);
    // const [clustersMessages, setClustersMessages] = useState<{[string]: string}>({});
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

    return {
        // fetchClustersList,
        nodes,
        messages,
        fetchClusterNodes,
        fetching
    }

}

export default useClustersApi;