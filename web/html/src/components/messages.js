// @flow
/* eslint-disable */
import * as React from "react";

type Severity = "info" | "success" | "warning" | "error";

export type ServerMessageType = {
  severity: Severity,
  text: string,
  args: Array<string>
}

export type MessageType = {
  severity: Severity,
  text: string |
    React.Node |
    Array<React.Node | string> // TODO only for compatibility, deprecate it
}

type Props = {
  /** Message objects to display */
  items: Array<MessageType> | MessageType
}

/**
 * Component to render multiple alert messages.
 *
 * It takes the list of messages in the `items` array.
 * The message objects must be in the following form:
 *
 * ```
 * items = [
 *   {
 *     severity: 'error' | 'warning' | 'success' | 'info',
 *     text: "The message text to display."
 *   },
 *   ...
 * ]
 * ```
 * The `Messages` module additionally offers the `Utils` object that contains
 * helper methods to create a single message object of a specific severity:
 *
 *  - `Utils.info(msg)`
 *  - `Utils.success(msg)`
 *  - `Utils.warning(msg)`
 *  - `Utils.error(msg)`
 *
 * The return value of these methods can be directly fed into the `items` property
 * of the component:
 *
 * ```
 * <Messages items={Utils.info("My info message.")}/>
 * ```
 */
const _classNames = {
    "error": "danger",
    "success": "success",
    "info": "info",
    "warning": "warning",
}

export class Messages extends React.Component<Props> {


    static info(text: string | React.Node): MessageType {
      return Messages.message("info", text);
    }

    static success(text: string | React.Node): MessageType {
      return Messages.message("success", text);
    }

    static error(text: string | React.Node): MessageType {
      return Messages.message("error", text);
    }

    static warning(text: string | React.Node): MessageType {
      return Messages.message("warning", text);
    }

    static message(severityIn: Severity, textIn: string | React.Node): MessageType {
        return {severity: severityIn, text: textIn};
    }

    render() {
        const items: Array<MessageType> = Array.isArray(this.props.items) ? this.props.items : [this.props.items];

        var msgs = items.map((item, index) =>
          <div key={"msg" + index} className={'alert alert-' + _classNames[item.severity]}>
            { Array.isArray(item.text) ? 
              item.text.map(txt => <div>{txt}</div>): item.text }
          </div>
        );

        return (<div key={"messages-pop-up"}>{msgs}</div>);
    }

}

export const fromServerMessage = (message: ServerMessageType, messageMap?: {[string]: string | ((any) => string | React.Node)}): ?MessageType => {
  let messageText = message.text;
  if (messageMap && (messageText in messageMap)) {
    messageText = messageMap[message.text];
    if (typeof messageText === "function") {
      messageText = messageText(message.args);
    }
  }
  let msg: ?MessageType;
  switch (message.severity) {
    case "info":
      msg = Messages.info(messageText);
      break;
    case "success":
      msg = Messages.success(messageText);
      break;
    case "warning":
      msg = Messages.warning(messageText);
      break;
    case "error":
      msg = Messages.error(messageText);
      break;
  }
  return msg;
}

function msg(severityIn: Severity, ...textIn: Array<React.Node>) {
    return textIn.map(function(txt) {return {severity: severityIn, text: textIn}});
}

/**
 * Helper methods to create a single message object of a specific severity
 *
 * The return value of these methods can be directly fed into the `items` property
 * of the `Messages` component.
 */
export const Utils = {
  info: function (textIn: string | React.Node | Array<string | React.Node>): Array<MessageType> {
    return msg("info", textIn);
  },
  success: function (textIn: string | React.Node | Array<string | React.Node>): Array<MessageType> {
    return msg("success", textIn);
  },
  warning: function (textIn: string | React.Node | Array<string | React.Node>): Array<MessageType> {
    return msg("warning", textIn);
  },
  error: function (textIn: string | React.Node | Array<string | React.Node>): Array<MessageType> {
    return msg("error", textIn);
  }
}
