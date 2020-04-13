// @flow
import {useState} from 'react';
import * as Network from 'utils/network';

import type {JsonResult} from "../../../utils/network";

type ExportersResultType = {
  exporters: {[string]: boolean},
  messages: {[string]: string}
};

function isRestartNeeded(data: ExportersResultType) {
  return Object.keys(data.exporters).some(key => data.messages[key] === "restart");
}

const useMonitoringApi = () => {
    const [action, setAction] = useState<null|"checking"|"enabling"|"disabling">(null);
    const [exportersStatus, setExportersStatus] = useState<?{[string]: boolean}>(null);
    const [exportersMessages, setExportersMessages] = useState<{[string]: string}>({});
    const [restartNeeded, setRestartNeeded] = useState<boolean>(false);
    const [messages, setMessages] = useState<Array<Object>>([]);

    const handleResponseError = (jqXHR: Object, arg: string = "") : any => {
      const msg = Network.responseErrorMessage(jqXHR);
      setMessages(msg);
    };

    const fetchStatus = (): Promise<{[string]: boolean}> => {
      setAction("checking");
      return Network.get("/rhn/manager/api/admin/config/monitoring").promise
      .then((data: JsonResult<ExportersResultType>) => {
        setExportersStatus(data.data.exporters);
        setExportersMessages(data.data.messages);
        setRestartNeeded(isRestartNeeded(data.data));
        return data.data.exporters;
      })
      .catch(handleResponseError)      
      .finally(() => {
        setAction(null);
      });
    };

    const changeStatus = (toEnable: boolean) => {
      setAction(toEnable ? "enabling" : "disabling");
      return Network.post("/rhn/manager/api/admin/config/monitoring", JSON.stringify({"enable": toEnable}), "application/json").promise
      .then((data : JsonResult<ExportersResultType>) => {
          if (data.data.exporters) {
            setExportersStatus(data.data.exporters);
            setExportersMessages(data.data.messages)
            setRestartNeeded(isRestartNeeded(data.data));
            
            if (!toEnable) { // disable monitoring
              const allDisabled : boolean = Object.keys(data.data.exporters).every(key => data.data.exporters[key] === false);
              const someEnabled : boolean = Object.keys(data.data.exporters).some(key => data.data.exporters[key] === true);
              if (allDisabled) {
                return {success: true, message: "disabling_succeeded"};
              } else if (someEnabled) {
                return {success: false, message: "disabling_failed_partially"};
              } else {
                return {success: false, message: "disabling_failed"};
              }
            } else if (toEnable) { // enable monitoring
              const allEnabled : boolean = Object.keys(data.data.exporters).every(key => data.data.exporters[key] === true);
              const someDisabled : boolean = Object.keys(data.data.exporters).some(key => data.data.exporters[key] === false);
              if (allEnabled) {
                return {success: true, message: "enabling_succeeded"};
              } else if (someDisabled) {
                return {success: false, message: "enabling_failed_partially"};
              } else {
                return {success: false, message: "enabling_failed"};
              }
            } else { // disabled -> disabled, enabled -> enabled
              return {success: true, message: "no_change"};
            }
          } else {
              setExportersStatus(null);
              setExportersMessages({});
              setRestartNeeded(false);
              return {success: false, message: "unknown"};
          }
        })
        .catch(handleResponseError)
        .finally(() => {
          setAction(null);
        });
    };

    return {
      action,
      fetchStatus,
      changeStatus,
      exportersStatus,
      exportersMessages,
      restartNeeded,
      messages,
      setMessages
    }

}

export default useMonitoringApi;
