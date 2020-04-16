// @flow
import * as React from 'react';
import {useEffect, useState} from 'react';
import useClustersApi from '../shared/api/use-clusters-api';
import {Messages} from 'components/messages';
import {Loading} from 'components/utils/Loading';
import {FormulaFormContext, FormulaFormContextProvider, FormulaFormRenderer} from 'components/formulas/FormulaComponentGenerator';
import {Panel} from 'components/panels/Panel';
import {SectionToolbar} from 'components/section-toolbar/section-toolbar';
import {Button} from 'components/buttons';

import type {ClusterType, ErrorMessagesType} from '../shared/api/use-clusters-api'
import type {Message} from 'components/messages';

type Props = {
  cluster: ClusterType,
  setMessages: (Array<Message>) => void
}

const ClusterConfig = (props: Props) => {
    const [layout, setLayout] = useState<any>(null);
    const [values, setValues] = useState<any>({});
    const {fetchProviderFormula} = useClustersApi();

    useEffect(() => {
      fetchProviderFormula(props.cluster.type.label, "config").then(data => {
        setLayout(data.layout);
        setValues({})
      })
      .catch((error : ErrorMessagesType) => {
        props.setMessages(error.messages);
      })
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

export default ClusterConfig;