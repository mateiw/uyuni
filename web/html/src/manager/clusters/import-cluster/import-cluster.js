// @flow
import {hot} from 'react-hot-loader';
import React, {useState, useEffect} from 'react';
import withPageWrapper from 'components/general/with-page-wrapper';
import {TopPanel} from "components/panels/TopPanel";
import SelectProvider from './select-provider';
import SelectManagementNode from './select-management-node';
import ProviderFormula from './provider-formula';
import FinalizeImport from './finalize-import';
import useUserLocalization from 'core/user-localization/use-user-localization';
import useClustersApi from '../shared/api/use-clusters-api';

import type {ClusterTypeType, ServerType} from '../shared/api/use-clusters-api';
import type {ActionChain} from 'components/action-schedule';
import type {FormulaValuesType} from '../shared/api/use-clusters-api';

declare var actionChains: Array<ActionChain>;

type Props = {
  availableProviders: Array<ClusterTypeType>,
  flashMessage: string,
};

type PageType = "provider"|"management-node"|"formula"|"finish";

const hashUrlRegex = /^#\/([^\/]*)(?:\/(.+))?$/;

function getHashId(): ?string {
    const match = window.location.hash.match(hashUrlRegex);
    return match ? match[2] : undefined;
}

function getHashAction(): ?string {
    const match = window.location.hash.match(hashUrlRegex);
    return match ? match[1] : undefined;
}

const ImportCluster = (props: Props) => {

    const [page, setPage] = useState<PageType>("provider");
    const [providerLabel, setProviderLabel] = useState<?string>(null);
    const [managementNode, setManagementNode] = useState<?ServerType>(null);
    const [providerConfig, setProviderConfig] = useState<?FormulaValuesType>(null);
    const {timezone, localTime} = useUserLocalization();
    const {startImport} = useClustersApi();

    let pageComponent = null;

    const updateView = (page: ?string, id: ?string) => {
        // TODO
        if (!page) {
            page = "provider";
        }
        setPage(page);
        // this.clearMessages();
    }

    useEffect(() => {
        nextPage("provider");
        window.addEventListener("popstate", (event) => {
            console.log("popstate");
            console.log(event);
            updateView(getHashAction(), getHashId());
        });
    }, []);

    // TODO extract history navigation in a component
    const nextPage = (page: string, id: ?string) => {
        history.pushState(null, "", "#/" + page + (id ? "/" + id : ""));
        updateView(getHashAction(), getHashId());
    }

    const prevPage = (page: string) => {
        history.back();
    }

    const saveProviderConfig = (values: FormulaValuesType) => {
        setProviderConfig(values);
    }

    const onImport = (earliest: Date, actionChain: ?string): Promise<any> => {
        console.log("on import");
        if (providerLabel && managementNode && providerConfig) {
            return startImport(providerLabel, managementNode.id, providerConfig, earliest, actionChain);
        }
        return Promise.reject(new Error('invalid data'));
    }

    if ("provider" === page) {
        pageComponent = <SelectProvider selectedProvider={providerLabel}
            availableProviders={props.availableProviders}
            onNext={(providerLabel: string) => {setProviderLabel(providerLabel); nextPage("management-node");}} />;
    } else if ("management-node" === page) {
        pageComponent = providerLabel ?
            <SelectManagementNode selectedNode={managementNode}
                provider={providerLabel}
                onNext={(node) => {setManagementNode(node); nextPage("formula")}}
                onPrev={() => prevPage("provider")} /> : null;
    } else if ("formula" === page) {
        pageComponent = providerLabel ?
            <ProviderFormula values={providerConfig}
                provider={providerLabel}
                onNext={(formulaValues) => {saveProviderConfig(formulaValues); nextPage("finish");}}
                onPrev={() => prevPage("provider")} /> : null;
    } else if ("finish" === page) {
        const selectedProvider = props.availableProviders.find(p => p.label === providerLabel);
        pageComponent = selectedProvider && managementNode ?
            <FinalizeImport provider={selectedProvider}
                managementNode={managementNode}
                onImport={onImport}
                onPrev={() => prevPage("formula")}
                localTime={localTime}
                timezone={timezone}
                actionChains={actionChains}
                /> : null;
    } else {
        pageComponent = <div>none</div>;
    }

    return (<TopPanel title={t('Import cluster')}
                icon="spacewalk-icon-cluster"
                helpUrl="/docs/reference/clusters/clusters-menu.html">
                { pageComponent }
            </TopPanel>);

}

export default hot(module)(withPageWrapper<Props>(ImportCluster));
