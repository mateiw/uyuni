// @flow
import React, {useEffect, useState} from 'react';
import useClustersApi, {withErrorMessages} from '../api/use-clusters-api';
import {Panel} from 'components/panels/Panel';
import {Button} from 'components/buttons';
import {Messages} from 'components/messages';
import {SectionToolbar} from 'components/section-toolbar/section-toolbar';
import {FormulaFormContext, FormulaFormContextProvider, FormulaFormRenderer} from 'components/formulas/FormulaComponentGenerator';

import type {FormulaValuesType} from '../api/use-clusters-api';
import type {Message} from 'components/messages';
import type {ErrorMessagesType} from  '../api/use-clusters-api';

// TODO move this to FormulaComponentGenerator once its flow-ified
// type ValidatedFormulaType = {
//   errors: {
//     required: Array<string>,
//     invalid: Array<string>
//   },
//   values: {[string]: any}
// }

type Props = {
  provider: string,
  values: ?FormulaValuesType,
  onNext: (FormulaValuesType) => void,
  onPrev: () => void,
  setMessages: (Array<Message>) => void
};

const ProviderConfig = (props: Props) => {
    const {fetchProviderFormula} = useClustersApi();
    const [layout, setLayout] = useState<any>(null);

    useEffect(() => {
      fetchProviderFormula(props.provider).then(data => {
        setLayout(data.layout);
      })
      .catch((error : ErrorMessagesType) => {
        props.setMessages(error.messages);
      });      
    }, [])

    const clickNext = ({errors, values}) => {
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
        props.onNext(values);
      }
    }

    return (layout ? 
              <FormulaFormContextProvider layout={layout}
                systemData={props.values ? props.values : {}}
                groupData={{}}
                scope="system">
                  {/* <Messages items={messageItems} /> */}
                  <Panel
                    headingLevel="h4"
                    title={t("Configure provider")}
                    footer={
                          <FormulaFormContext.Consumer>
                            {({validate}) => 
                                <div className="btn-group">
                                  <Button
                                      id="btn-prev"
                                      text={t("Prev")}
                                      className="btn-default"
                                      icon="fa-arrow-left"
                                      handler={() => props.onPrev()}
                                  />                      
                                  <Button id="btn-next"
                                    disabled={false}
                                    icon="fa-arrow-right"
                                    text={t("Next")}
                                    className={"btn-success"}
                                    handler={() => {clickNext(validate())}} />
                                </div>
                            }
                          </FormulaFormContext.Consumer>
                    }>
                      <SectionToolbar>
                        <div className='action-button-wrapper'>
                          <div className='btn-group'>
                            <FormulaFormContext.Consumer>
                              {({clearValues}) => 
                                <Button id="reset-btn" icon="fa-eraser" text="Clear values"
                                  className="btn btn-default"
                                  handler={() => clearValues(() => window.confirm("Are you sure you want to clear all values?"))} />
                              }
                            </FormulaFormContext.Consumer>
                          </div>
                        </div>    
                      </SectionToolbar>
                      <div style={{marginTop: "15px"}}>
                        <FormulaFormRenderer />
                      </div>
                  </Panel>
                </FormulaFormContextProvider>
                  : <div>{t("Loading...")}</div>
            );
}

export default withErrorMessages(ProviderConfig);
