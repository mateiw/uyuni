// @flow
import {hot} from 'react-hot-loader';
import React, {useState} from 'react';
import withPageWrapper from 'components/general/with-page-wrapper';
import {TopPanel} from "components/panels/TopPanel";
import SelectProvider from './select-provider';
import SelectManagementNode from './select-management-node';
import ProviderFormula from './provider-formula';
import FinalizeImport from './finalize-import';

import type {ClusterTypeType, ServerType} from '../shared/api/use-clusters-api';

type Props = {
  availableProviders: Array<ClusterTypeType>,
  flashMessage: string,
};

const ImportCluster = (props: Props) => {

    const [page, setPage] = useState<"select-provider"|"select-management-node"|"provider-formula"|"finish">("select-provider");
    const [providerLabel, setProviderLabel] = useState<?string>(null);
    const [managementNode, setManagementNode] = useState<?ServerType>(null);
    const [providerConfig, setProviderConfig] = useState<?{[string]: any}>(null);
    let pageComponent = null;


    const saveProviderConfig = (values) => {
        console.log(values);
        setProviderConfig(values);
    }

    const onImport = () => {
        console.log("on import");
    }


    if ("select-provider" === page) {
        pageComponent = <SelectProvider availableProviders={props.availableProviders}
            onNext={(providerLabel: string) => {setProviderLabel(providerLabel); setPage("select-management-node");}} />;
    } else if ("select-management-node" === page) {
        pageComponent = providerLabel ? <SelectManagementNode provider={providerLabel} onNext={(node) => {setManagementNode(node); setPage("provider-formula")}}/> : null;
    } else if ("provider-formula" === page) {
        pageComponent = providerLabel ? <ProviderFormula provider={providerLabel} onNext={(formulaValues) => {saveProviderConfig(formulaValues); setPage("finish");}}/> : null;
    } else {
        const selectedProvider = props.availableProviders.find(p => p.label === providerLabel);
        pageComponent = selectedProvider && managementNode ? <FinalizeImport provider={selectedProvider} managementNode={managementNode} onImport={() => onImport()}/> : null;
    }

    return (<TopPanel title={t('Import cluster')}
            icon="spacewalk-icon-cluster"
            helpUrl="/docs/reference/clusters/clusters-menu.html">
            { pageComponent }
            </TopPanel>);

}

export default hot(module)(withPageWrapper<Props>(ImportCluster));
