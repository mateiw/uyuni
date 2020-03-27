// @flow
import {hot} from 'react-hot-loader';
import React, {useEffect} from 'react';
import withPageWrapper from 'components/general/with-page-wrapper';
import {TopPanel} from "components/panels/TopPanel";
import { Panel } from 'components/panels/Panel';
import {Button} from 'components/buttons';

import type {ClusterTypeType} from '../shared/api/use-clusters-api';

type Props = {
  availableTypes: Array<ClusterTypeType>,
  flashMessage: string,
};

const ImportCluster = (props: Props) => {

    // const panelButtons = (
    //     <div className="pull-right btn-group">
    //         <LinkButton
    //             id="importCluster"
    //             icon="fa-plus"
    //             className="btn-link js-spa"
    //             title={t('Import an existing cluster')}
    //             text={t('Import cluster')}
    //             href="/rhn/manager/clusters/import"
    //         />
    //     </div>
    // );

    return (
        <TopPanel title={t('Import cluster')}
            icon="spacewalk-icon-cluster"
            helpUrl="/docs/reference/clusters/clusters-menu.html">

            <Panel
                headingLevel="h2"
                header={t("Available cluster providers")}
                footer={
                    <div className="btn-group">
                        <Button
                            id="btn-next"
                            disabled={false}
                            text={t("Next")}
                            className="btn-default"
                            icon="fa-arrow-right"
                            handler={() => {}}
                        />
                    </div>
                }>
                            {props.availableTypes.map(type => <div>{type.name}</div>)}

            </Panel>


        </TopPanel>);
}

export default hot(module)(withPageWrapper<Props>(ImportCluster));