// @flow
import {hot} from 'react-hot-loader';
import withPageWrapper from 'components/general/with-page-wrapper';
import React from 'react';
import {TopPanel} from 'components/panels/TopPanel';
import {HashRouter, Route, Switch} from 'components/utils/HashRouter';
import {TabLabel} from 'components/tab-container'
import ClusterOverview from './cluster-overview';
import ClusterConfig from './cluster-config';
import {withErrorMessages} from '../shared/api/use-clusters-api';
import type {ClusterType } from '../shared/api/use-clusters-api'
import type {Message} from 'components/messages';

type Props = {
  cluster: ClusterType,
  flashMessage: String,
  setMessages: (Array<Message>) => void
};

const Cluster = (props: Props) => {
    return (
      <React.Fragment>
        <TopPanel title={props.cluster.name}
            icon="spacewalk-icon-cluster"
            helpUrl="/docs/reference/clusters/clusters-menu.html">
            <HashRouter initialPath="overview">
              <div className="spacewalk-content-nav">
                <ul className="nav nav-tabs">
                    <Route path="overview">
                        {({match}) =>
                            <TabLabel active={match} text={t("Overview")} hash="#/overview" />
                        }
                    </Route>
                    <Route path="config">
                        {({match}) =>
                            <TabLabel active={match} text={t("Configuration")} hash="#/config" />
                        }
                    </Route>
                </ul>        
              </div>
              <Switch>
                <Route path="overview">
                  <ClusterOverview cluster={props.cluster} setMessages={props.setMessages}/>
                </Route>
                <Route path="config">
                  <ClusterConfig cluster={props.cluster} setMessages={props.setMessages}/>
                </Route>
              </Switch>


            </HashRouter>
        </TopPanel>


      </React.Fragment>);
}

export default hot(module)(withPageWrapper<Props>(withErrorMessages(Cluster)));