// @flow
import { hot } from 'react-hot-loader';
import withPageWrapper from 'components/general/with-page-wrapper';
import React, {useEffect, useState} from 'react';
import {TopPanel} from 'components/panels/TopPanel';
import {Panel} from 'components/panels/Panel';
import {PanelRow} from 'components/panels/PanelRow';
import {Label} from 'components/input/Label'; 
import {SystemLink} from 'components/links';
import {Table} from 'components/table/Table';
import {Column} from 'components/table/Column';
import Functions from 'utils/functions';
import {SearchField} from 'components/table/SearchField';
import {AsyncButton, LinkButton, Button} from 'components/buttons';
import useClustersApi, {withErrorMessages} from '../shared/api/use-clusters-api';
import {HashRouter, Route} from 'components/utils/HashRouter';
import {TabLabel} from 'components/tab-container'
import {SectionToolbar} from 'components/section-toolbar/section-toolbar';
import {FormulaFormContext, FormulaFormContextProvider, FormulaFormRenderer} from 'components/formulas/FormulaComponentGenerator';
import {Messages} from 'components/messages';
import {Loading} from 'components/utils/Loading';

import type {ClusterType, ClusterNodeType, ErrorMessagesType} from '../shared/api/use-clusters-api'
import type {Message} from 'components/messages';
import type {FormulaValuesType} from '../shared/api/use-clusters-api';

type Props = {
  cluster: ClusterType,
  flashMessage: String,
  setMessages: (Array<Message>) => void
};

type GeneralProps = {
  cluster: ClusterType,
  setMessages: (Array<Message>) => void
};


const General = (props: GeneralProps) => {
  const [selectedNode, setSelectedNode] = useState<?string>(null);
  const [nodes, setNodes] = useState<Array<ClusterNodeType>>([]);
  const [fetching, setFetching] = useState<boolean>(false);
  const {fetchClusterNodes} = useClustersApi();

  const fetchData = () => {
    setFetching(true);
    fetchClusterNodes(props.cluster.id)
    .then((nodes) => setNodes(nodes))
    .catch((error : ErrorMessagesType) => {
      props.setMessages(error.messages);
    })
    .finally((fetching) => setFetching(false));
  }

  useEffect(() => {
    fetchData();
  }, []);

  const onRemove = () => {
    if (selectedNode) {
      window.location.replace(`/rhn/manager/cluster/${props.cluster.id}/remove/${selectedNode}`);
    }
  }

  const filterFunc = (row, criteria) => {
      const keysToSearch = ['hostname'];
      if (criteria) {
          return keysToSearch.map(key => row[key]).join().toLowerCase().includes(criteria.toLowerCase());
      }
      return true;
  };

  return (
      <React.Fragment>
        <SectionToolbar>
          <div className="pull-right btn-group">
              <LinkButton
                id="join-btn" 
                icon="fa-plus"
                text={t("Join Node")}
                className="gap-right btn-default"
                href={`/rhn/manager/cluster/${props.cluster.id}/join`}
                />
              <Button
                id="remove-btn" 
                disabled={!selectedNode}
                icon="fa-minus"
                text={t("Remove Node")}
                className="gap-right btn-default"
                handler={onRemove}
                />              
              <AsyncButton id="refresh-btn" defaultType="btn-default"
                icon="fa-refresh"
                text={ t("Refresh") }
                className="gap-right"
                action={() => {fetchData(); setSelectedNode(null);}}/>
          </div>
        </SectionToolbar>    

        <Panel headingLevel="h3" title={t('Cluster Properties')}>
          <PanelRow>
            <Label name={t('Name')} className='col-md-3'/>
            <div className='col-md-6'>{props.cluster.name}</div>
          </PanelRow>
          <PanelRow>
            <Label name={t('Type')} className='col-md-3'/>
            <div className='col-md-6'>{props.cluster.type.name}</div>
          </PanelRow>
          <PanelRow>
            <Label name={t('Management node')} className='col-md-3'/>
            <SystemLink id={props.cluster.managementNode.id} className='col-md-6'>{props.cluster.managementNode.name}</SystemLink>
          </PanelRow> 
        </Panel>
        <Table
            data={nodes}
            loading={fetching}
            identifier={row => row.hostname}
            initialSortColumnKey="hostname"
            searchField={(
                <SearchField
                filter={filterFunc}
                placeholder={t('Filter by any value')}
                />
            )}>
            <Column
                columnKey="select"
                header={''}
                cell={row =>
                     <input type="radio" value={row.hostname} 
                        checked={selectedNode == row.hostname} 
                        onChange={(ev: SyntheticInputEvent<HTMLInputElement>) => setSelectedNode(ev.target.value)} />
                }
            />                 
            <Column
                columnKey="hostname"
                width="97%"                
                comparator={Functions.Utils.sortByText}
                header={t('Hostname')}
                cell={row => row.hostname }
            />
        </Table>
      </React.Fragment>
    );
}


type ConfigProps = {
  cluster: ClusterType,
  setMessages: (Array<Message>) => void
}

const Config = (props: ConfigProps) => {
    const [layout, setLayout] = useState<any>(null);
    const [values, setValues] = useState<any>({});
    const [fetching, setFetching] = useState<boolean>(false);
    const {fetchProviderFormula} = useClustersApi();

    useEffect(() => {
      setFetching(true);
      fetchProviderFormula(props.cluster.type.label, "config").then(data => {
        setLayout(data.layout);
        setValues({})
      })
      .catch((error : ErrorMessagesType) => {
        props.setMessages(error.messages);
      })
      .finally(() => setFetching(false));
    }, [])

    const save = ({errors, values}) => {
      if (errors) {
        const messages = [];
        if (errors.required && errors.required.length > 0) {
            messages.push(Messages.error(t("Please input required fields: {0}", errors.required.join(', '))));
        }
        if (errors.invalid && errors.invalid.length > 0) {
            messages.push(Messages.error(t("Invalid format of fields: {0}", errors.invalid.join(', '))));
        }
        props.setMessages(messages);
      } else {
        // TODO save
      }
    }

  return ( layout ?
      <React.Fragment>
        <FormulaFormContextProvider layout={layout}
          systemData={values}
          groupData={{}}
          scope="system">
          <SectionToolbar>
            <div className='action-button-wrapper'>
              <div className='btn-group'>
                <FormulaFormContext.Consumer>
                  {({validate, clearValues}) => 
                    <React.Fragment>
                      <Button id="btn-save" icon="fa-floppy-o"
                        text={t("Save")}
                        className="btn-success"
                        handler={() => {save(validate())}} />
                      <Button id="reset-btn" icon="fa-eraser" text="Clear values"
                        className="btn-default"
                        handler={() => clearValues(() => window.confirm("Are you sure you want to clear all values?"))} />

                    </React.Fragment>                      
                  }
                </FormulaFormContext.Consumer>
              </div>
            </div>    
          </SectionToolbar>
          <Panel headingLevel="h3" title={t('Cluster Configuration')}>
            <FormulaFormRenderer />
          </Panel>
        </FormulaFormContextProvider>
      </React.Fragment> :
      <Loading/>
      );
}


const Cluster = (props: Props) => {
    return (
      <React.Fragment>
        <TopPanel title={props.cluster.name}
            icon="spacewalk-icon-cluster"
            helpUrl="/docs/reference/clusters/clusters-menu.html">
            <HashRouter initialPath="general" renderOnlyMatching={false}>
              <div className="spacewalk-content-nav">
                <ul className="nav nav-tabs">
                    <Route path="general">
                        {({matching}) =>
                          <React.Fragment>
                            <TabLabel active={matching} text={t("General")} hash="#/general" />
                          </React.Fragment>
                        }
                    </Route>
                    <Route path="config">
                        {({matching}) =>
                          <React.Fragment>
                            <TabLabel active={matching} text={t("Configuration")} hash="#/config" />
                          </React.Fragment>  
                        }
                    </Route>
                </ul>        
              </div>
              <Route path="general">
                {({matching}) =>
                  matching ? <General cluster={props.cluster} setMessages={props.setMessages}/> : null }
              </Route>
              <Route path="config">
                {({matching}) =>
                  matching ? <Config cluster={props.cluster} setMessages={props.setMessages}/>: null }
              </Route>

            </HashRouter>
        </TopPanel>


      </React.Fragment>);
}

export default hot(module)(withPageWrapper<Props>(withErrorMessages(Cluster)));