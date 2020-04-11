// @flow
import {hot} from 'react-hot-loader';
import React, {useState, useEffect} from 'react';
import {AsyncButton, Button} from 'components/buttons';
import {Panel} from 'components/panels/Panel';
import { ActionSchedule } from 'components/action-schedule';
import {SystemLink} from 'components/links';
import Functions from 'utils/functions';
import {Messages} from 'components/messages';
import {withErrorMessages}  from '../shared/api/use-clusters-api';
import {ActionLink, ActionChainLink} from 'components/links';

import type {ActionChain} from "components/action-schedule";
import type {ClusterTypeType, ServerType} from '../shared/api/use-clusters-api';
import type {Message} from 'components/messages';
import type {ErrorMessagesType} from  '../shared/api/use-clusters-api';

type Props = {
    provider: ClusterTypeType,
    managementNode: ServerType,
    onImport: (earliest: Date, actionChain: ?string) => Promise<any>,
    onPrev: () =>  void,
    localTime: string,
    timezone: string,
    actionChains: Array<ActionChain>,
    setMessages: (Array<Message>) => void
};

const FinalizeImport = (props: Props) => {
    const [actionChain, setActionChain] = useState<?ActionChain>(null);
    const [earliest, setEarliest] = useState(Functions.Utils.dateWithTimezone(props.localTime));
    const [disableImport, setDisableImport] = useState(false);


    const onImport = (): Promise<any> => {
        return props.onImport(earliest, actionChain ? actionChain.text: null).then(
            (actionId) => {
                setDisableImport(true);
                const actionChainMsg = Messages.info(<span>{t("Action has been successfully added to the Action Chain ")}
                        <ActionChainLink id={actionId}>{actionChain ? actionChain.text : ""}</ActionChainLink>.</span>);
                const actionMsg = Messages.info(<span>{t("Importing cluster has been ")}
                          <ActionLink id={actionId}>{t("scheduled")}.</ActionLink></span>);
                props.setMessages([actionChain ? actionChainMsg : actionMsg]);
            },
            (error: ErrorMessagesType) => {
                props.setMessages(error.messages);
            });
    }

    return (<Panel
                    headingLevel="h4"
                    title={t("Confirm Import")}
                    footer={
                        <div className="btn-group">
                            <Button
                                id="btn-prev"
                                text={t("Prev")}
                                className="btn-default"
                                icon="fa-arrow-left"
                                handler={() => props.onPrev()}
                            />
                            <AsyncButton
                                id="btn-next"
                                disabled={disableImport}
                                text={t("Import")}
                                className="btn-success"
                                icon="fa-download"
                                action={() => onImport()}
                            />
                        </div>
                    }>
                    <div className="form-horizontal">
                        <div className="form-group">
                            <label className="col-md-3 control-label">{t("Provider:")}</label>
                            <div className="col-md-9">{props.provider.name}</div>
                        </div>
                        <div className="form-group">
                            <label className="col-md-3 control-label">{t("Management Node:")}</label>
                            <div className="col-md-9"><SystemLink id={props.managementNode.id}>{props.managementNode.name}</SystemLink></div>
                        </div>
                    </div>

                    <ActionSchedule
                        timezone={props.timezone}
                        localTime={props.localTime}
                        earliest={earliest}
                        actionChains={props.actionChains}
                        actionChain={actionChain}
                        onActionChainChanged={(actionChain) => setActionChain(actionChain)}
                        onDateTimeChanged={(date) => {setEarliest(date); setActionChain(null);}}
                    />
                </Panel>);
}

export default withErrorMessages(FinalizeImport);