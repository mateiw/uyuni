// @flow
import {useState} from 'react';
import Network from 'utils/network';

import type {JsonResult} from "utils/network";

export type ClusterType = {
    id: number,
    name: string
}

type ClustersResultType = {
    clusters: Array<ClusterType>,
    messages: {[string]: string}
}

const useClustersApi = ()  => {
    const [clusters, setClusters] = useState<Array<ClusterType>>([]);
    const [clustersMessages, setClustersMessages] = useState<{[string]: string}>({});
    const [messages, setMessages] = useState<Array<Object>>([]);
    const [fetching, setFetching] = useState<boolean>(false);

    const handleResponseError = (jqXHR: Object, arg: string = ""): Array<ClusterType> => {
      const msg = Network.responseErrorMessage(jqXHR);
      setMessages(msg);
      return [];
    };

    const fetchClusters = () : Promise<Array<ClusterType>> => {
        return Network.get("/rhn/manager/api/clusters").promise
            .then((data: JsonResult<ClustersResultType>) => {
                setFetching(true);
                setClusters(data.data.clusters);
                setClustersMessages(data.data.messages);
                return data.data.clusters;
            })
            .catch(handleResponseError)
            .finally(() => {
                setFetching(false);
            });
    }

    return {
        fetchClusters
    }

}

export default useClustersApi;