// @flow
import * as React from 'react';
import {useState, useEffect} from 'react';
import {Panel} from 'components/panels/Panel';
import {AsyncButton, Button} from 'components/buttons';
import {ActionLink, ActionChainLink, SystemLink} from 'components/links';
import {ActionSchedule} from 'components/action-schedule';
import Functions from 'utils/functions';
import useClustersApi, {withErrorMessages}  from '../api/use-clusters-api';
import useUserLocalization from 'core/user-localization/use-user-localization';
import {Messages} from 'components/messages';

import type {ActionChain} from "components/action-schedule";
import type {ErrorMessagesType} from '../api/use-clusters-api';
import type {Message} from 'components/messages';

declare var actionChains: Array<ActionChain>;

type Props = {
    title: string,
    panel: React.Node,
    // successMessage: (number) => React.Node,
    schedule: (earliest: Date, actionChain: ?string) => Promise<any>,
    onPrev: () =>  void,
    setMessages: (Array<Message>) => void
};

const ScheduleClusterAction = (props: Props) => {
    const {timezone, localTime} = useUserLocalization();

    const [actionChain, setActionChain] = useState<?ActionChain>(null);
    const [earliest, setEarliest] = useState(Functions.Utils.dateWithTimezone(localTime));
    const [disableSchedule, setDisableSchedule] = useState(false);

    const onSchedule = (): Promise<any> => {
        return props.schedule(earliest, actionChain ? actionChain.text: null).then(
            (actionId) => {
                setDisableSchedule(true);
                const actionChainMsg = Messages.info(<span>{t("Action has been successfully added to the Action Chain ")}
                        <ActionChainLink id={actionId}>{actionChain ? actionChain.text : ""}</ActionChainLink>.</span>);
                const actionMsg = Messages.info(<span>{t("Action has been ")}
                          <ActionLink id={actionId}>{t("scheduled")}</ActionLink>{t(" successfully.")}</span>);
                props.setMessages([actionChain ? actionChainMsg : actionMsg]);
            },
            (error: ErrorMessagesType) => {
                props.setMessages(error.messages);
            });
    }

    return (<Panel
                headingLevel="h4"
                title={props.title}
                footer={
                    <div className="btn-group">
                        <Button
                            id="btn-prev"
                            disabled={disableSchedule}
                            text={t("Prev")}
                            className="btn-default"
                            icon="fa-arrow-left"
                            handler={() => props.onPrev()}
                        />
                        <AsyncButton
                            id="btn-next"
                            disabled={disableSchedule}
                            text={t("Join")}
                            className="btn-success"
                            icon="fa-plus"
                            action={() => onSchedule()}
                        />
                    </div>
                }>

                {props.panel}

                <ActionSchedule
                    timezone={timezone}
                    localTime={localTime}
                    earliest={earliest}
                    onDateTimeChanged={(date) => {setEarliest(date); setActionChain(null);}}
                />
            </Panel>);
}

export default withErrorMessages(ScheduleClusterAction);