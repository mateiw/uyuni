// @flow
import {hot} from 'react-hot-loader';
import React, {useState, useEffect} from 'react';
import withPageWrapper from 'components/general/with-page-wrapper';
import {TopPanel} from "components/panels/TopPanel";
import SelectProvider from './select-provider';
import FormulaConfig from '../shared/ui/formula-config';
import SelectServer from '../shared/ui/select-server';
import useClustersApi from '../shared/api/use-clusters-api';
import {HashRouter, Route} from 'components/utils/HashRouter';
import ScheduleClusterAction from '../shared/ui/schedule-cluster-action';
import {SystemLink} from 'components/links';

import type {ClusterTypeType, ServerType} from '../shared/api/use-clusters-api';
import type {ActionChain} from 'components/action-schedule';
import type {FormulaValuesType} from '../shared/api/use-clusters-api';

type Props = {
  availableProviders: Array<ClusterTypeType>,
  flashMessage: string,
};

const ImportCluster = (props: Props) => {

    const [providerLabel, setProviderLabel] = useState<?string>(null);
    const [managementNode, setManagementNode] = useState<?ServerType>(null);
    const [providerConfig, setProviderConfig] = useState<?FormulaValuesType>(null);
    const {fetchManagementNodes, startImport} = useClustersApi();

    const onImport = (earliest: Date, actionChain: ?string): Promise<any> => {
        if (providerLabel && managementNode && providerConfig) {
            return startImport(providerLabel, managementNode.id, providerConfig, earliest, actionChain);
        }
        return Promise.reject(new Error('invalid data'));
    }

    return (<TopPanel title={t('Import cluster')}
                icon="spacewalk-icon-cluster"
                helpUrl="/docs/reference/clusters/clusters-menu.html">
                <HashRouter initialPath="provider">
                    <Route path="provider">
                        {({goTo}) =>
                            <SelectProvider selectedProvider={providerLabel}
                                availableProviders={props.availableProviders}
                                onNext={(providerLabel: string) => {setProviderLabel(providerLabel); goTo("management-node");}} />
                                }
                    </Route>
                    <Route path="management-node">
                        {({goTo, back}) => providerLabel ?
                            <SelectServer title={t("Available management nodes")}
                                selectedServer={managementNode}
                                fetchServers={() => fetchManagementNodes(providerLabel)}
                                onNext={(node) => {setManagementNode(node); goTo("provider-config");}}
                                onPrev={back} />                               
                            : null}
                    </Route>
                    <Route path="provider-config">
                        {({goTo, back}) => providerLabel ?
                            <FormulaConfig values={providerConfig}
                                provider={providerLabel}
                                title={t("Provider configuration")}
                                formula="config"
                                onNext={(formulaValues) => {setProviderConfig(formulaValues); goTo("schedule");}}
                                onPrev={back} /> : null}
                    </Route> 
                    <Route path="schedule">
                        {({goTo, back}) => {
                            const selectedProvider = props.availableProviders.find(p => p.label === providerLabel);
                            return selectedProvider && managementNode ?
                                <ScheduleClusterAction
                                    title={t("Schedule join node")}
                                    panel={
                                        <div className="form-horizontal">
                                            <div className="form-group">
                                                <label className="col-md-3 control-label">{t("Provider:")}</label>
                                                <div className="col-md-9">{selectedProvider.name}</div>
                                            </div>
                                            <div className="form-group">
                                                <label className="col-md-3 control-label">{t("Management Node:")}</label>
                                                <div className="col-md-9"><SystemLink id={managementNode.id}>{managementNode.name}</SystemLink></div>
                                            </div>
                                        </div>
                                    }
                                    schedule={onImport}
                                    onPrev={back}
                                    /> : null;
                        }}
                    </Route>
                </HashRouter>
            </TopPanel>);

}

export default hot(module)(withPageWrapper<Props>(ImportCluster));
