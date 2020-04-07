// @flow
import React, {useEffect, useState} from 'react';
import useClustersApi from '../shared/api/use-clusters-api';
import {Panel} from 'components/panels/Panel';
import {Button} from 'components/buttons';
import {Messages} from 'components/messages';
import {FormulaFormContext, FormulaFormContextProvider, FormulaFormRenderer} from 'components/formulas/FormulaComponentGenerator';

// TODO move this to FormulaComponentGenerator once its flow-ified
type ValidatedFormulaType = {
  errors: {
    required: Array<string>,
    invalid: Array<string>
  },
  values: {[string]: any}
}

type Props = {
  provider: string,
  onNext: ({[string]: any}) => void
};

const ProviderFormula = (props: Props) => {
    const {fetchFormulaData} = useClustersApi();
    const [layout, setLayout] = useState<any>(null);
    const [messages, setMessages] = useState<Array<string>>([]);

    useEffect(() => {
      fetchFormulaData(props.provider).then(data => {
        console.log(data.layout);
        setLayout(data.layout);
      });
    }, [])

    const clickNext = ({errors, values}) => {
      if (errors) {
        const messages = [];
        if (errors.required && errors.required.length > 0) {
            messages.push(t("Please input required fields: {0}", errors.required.join(', ')));
        }
        if (errors.invalid && errors.invalid.length > 0) {
            messages.push(t("Invalid format of fields: {0}", errors.invalid.join(', ')));
        }
        setMessages(messages);
      } else {
        props.onNext(values);
      }
    }

    let messageItems = messages.map((msg) => {
        return { severity: "error", text: msg };
    });

    return (layout ? 
              <FormulaFormContextProvider layout={layout}
                systemData={{}}
                groupData={{}}
                scope="system">
                  <Messages items={messageItems} />
                  <Panel
                    headingLevel="h2"
                    header={t("Configure import")}
                    footer={
                        <div className="btn-group">
                          <FormulaFormContext.Consumer>
                            {({validate, clearValues}) => 
                                <div className="btn-group">
                                    <Button id="btn-next" disabled={false} icon="fa-arrow-right" text={t("Next")} className={"btn-default"} handler={() => {clickNext(validate())}} />
                                    <Button id="reset-btn" icon="fa-eraser" text="Clear values" className="btn btn-default" handler={() => clearValues(() => window.confirm("Are you sure you want to clear all values?"))} />    
                                </div>
                            }
                          </FormulaFormContext.Consumer>
                        </div>
                    }>
                      <div>
                        <FormulaFormRenderer />
                      </div>
                  </Panel>
                </FormulaFormContextProvider>
                  : <div>{t("Loading...")}</div>
            );
}

export default ProviderFormula;
