// @flow
/* eslint-disable */
import * as React from "react";

export type Message = {
  severity: "error" | "success" | "info" | "warning",
  text: string | React.Node
}

type Props = {
  items: Array<Message>  
}

export class Messages extends React.Component<Props> {
    _classNames = {
        "error": "danger",
        "success": "success",
        "info": "info",
        "warning": "warning",
    }

    static info(text: string | React.Node): Message {
      return msg("info", text)[0];
    }    

    static success(text: string | React.Node): Message {
      return msg("success", text)[0];
    }  

    static error(text: string | React.Node): Message {
      return msg("error", text)[0];
    }  

    static warning(text: string | React.Node): Message {
      return msg("warning", text)[0];
    }

    render() {
        var msgs = this.props.items.map(function(item, index) {
            return (<div key={"msg" + index} className={'alert alert-' + this._classNames[item.severity]}>{item.text}</div>);
        }.bind(this));
        return (<div key={"messages-pop-up"}>{msgs}</div>);
    }

}

function msg(severityIn, ...textIn: Array<string | React.Node>): Array<Message> {
    return textIn.map((txt) => ({severity: severityIn, text: txt}));
}

/**
 * @deprecated Use Messages.info|success|warning|error whenever possible
 */
export const Utils = {
  info: function (...textIn: Array<string | React.Node>) {
    return msg("info", ...textIn);
  },
  success: function (...textIn: Array<string | React.Node>) {
    return msg("success", ...textIn);
  },
  warning: function (...textIn: Array<string | React.Node>) {
    return msg("warning", ...textIn);
  },
  error: function (...textIn: Array<string | React.Node>) {
    return msg("error", ...textIn);
  }
}

