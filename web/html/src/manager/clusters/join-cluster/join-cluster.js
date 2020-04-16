// @flow
import {hot} from 'react-hot-loader';
import React, {useState} from 'react';
import {TopPanel} from "components/panels/TopPanel";
import withPageWrapper from 'components/general/with-page-wrapper';
import useClustersApi, {withErrorMessages} from '../shared/api/use-clusters-api';
import FormulaConfig from '../shared/ui/formula-config';
import SelectServer from '../shared/ui/select-server';
import {HashRouter, Route, Switch} from 'components/utils/HashRouter';
import ScheduleClusterAction from '../shared/ui/schedule-cluster-action';
import {SystemLink} from 'components/links';

import type {FormulaValuesType, ServerType} from '../shared/api/use-clusters-api';
import type {ClusterType} from '../shared/api/use-clusters-api';

type Props = {
  cluster: ClusterType,
  flashMessage: string,
};

const JoinCluster = (props: Props) => {
    // const [providerConfig, setProviderConfig] = useState<?FormulaValuesType>(null);
    const [joinConfig, setJoinConfig] = useState<?FormulaValuesType>(null);
    const [nodeToJoin, setNodeToJoin] = useState<?ServerType>(null);

    const {fetchNodesToJoin, scheduleJoinNode} = useClustersApi();

    const scheduleJoin = (earliest: Date, actionChain: ?string): Promise<any> => {
        if (nodeToJoin && joinConfig) {
            return scheduleJoinNode(props.cluster.id, nodeToJoin.id, joinConfig, earliest, actionChain);
        }
        return Promise.reject(new Error('invalid data'));
    }

    return (<TopPanel title={t('Join ') + props.cluster.name}
                icon="spacewalk-icon-cluster"
                helpUrl="/docs/reference/clusters/clusters-menu.html">
                <HashRouter initialPath="select-node">
                    <Switch>
                        <Route path="select-node">
                            {({goTo, back}) =>
                                <SelectServer title={t("Select system to join")}
                                    selectedServer={nodeToJoin}
                                    fetchServers={() => fetchNodesToJoin(props.cluster.id) }
                                    onNext={(node) => {setNodeToJoin(node); goTo("join-config")}}/>}                             
                        </Route>
                        <Route path="join-config">
                            {({goTo, back}) =>
                                <FormulaConfig values={joinConfig}
                                    provider={props.cluster.type.label}
                                    title={t("Join node configuration")}
                                    formula="join"
                                    onNext={(formulaValues) => {setJoinConfig(formulaValues); goTo("schedule");}}
                                    onPrev={back} />}
                        </Route>
                        <Route path="schedule">
                            {({goTo, back}) => {
                                return nodeToJoin?
                                    <ScheduleClusterAction
                                        title={t("Schedule join node")}
                                        panel={
                                            <div className="form-horizontal">
                                                <div className="form-group">
                                                    <label className="col-md-3 control-label">{t("Cluster:")}</label>
                                                    <div className="col-md-9">{props.cluster.name}</div>
                                                </div>
                                                <div className="form-group">
                                                    <label className="col-md-3 control-label">{t("Node to join:")}</label>
                                                    <div className="col-md-9"><SystemLink id={nodeToJoin.id}>{nodeToJoin.name}</SystemLink></div>
                                                </div>
                                            </div>
                                        }
                                        schedule={scheduleJoin}
                                        onPrev={back}
                                        /> : null;
                            }}
                        </Route>
                    </Switch>                        
                </HashRouter>                    
            </TopPanel>);
}

export default hot(module)(withPageWrapper<Props>(withErrorMessages(JoinCluster)));
