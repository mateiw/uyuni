// @flow
/* eslint-disable */
"use strict";

import Functions from '../utils/functions';
import {Messages, Utils as MessagesUtils} from '../components/messages';

import type {Cancelable} from "../utils/functions";

declare var csrfToken: string;

export type JsonResult<T> = {
  success: boolean,
  messages: Array<String>,
  data: T
}



function request(url: string, type, headers, data, contentType: string, processData: boolean = true) : Cancelable {
   const a = $.ajax({
         url: url,
         data: data,
         type: type,
         contentType: contentType,
         processData: processData,
         beforeSend: (xhr) => {
            if(headers !== undefined) {
                Object.keys(headers).forEach(header => {
                    xhr.setRequestHeader(header, headers[header]);
                });
            }
         }
   });
   return Functions.Utils.cancelable(Promise.resolve(a), () => a.abort());
}

function post(url: string, data, contentType: string, processData: boolean = true): Cancelable {
    return request(url, "POST", { "X-CSRF-Token": csrfToken }, data, contentType, processData);
}

function del(url: string, data, contentType: string, processData: boolean = true): Cancelable {
    return request(url, "DELETE", { "X-CSRF-Token": csrfToken }, data, contentType, processData);
}

function put(url: string, data, contentType: string, processData: boolean = true): Cancelable {
    return request(url, "PUT", { "X-CSRF-Token": csrfToken }, data, contentType, processData);
}

function get(url: string, contentType: string = "application/json"): Cancelable {
    return request(url, "GET", {}, {}, contentType);
}

function errorMessageByStatus(status: number) {
    if (status === 401) {
        return [t("Session expired, please reload the page.")];
    } else if (status === 403) {
        return [t("Authorization error, please reload the page or try to logout/login again.")];
    } else if (status >= 500) {
        return [t("Server error, please check log files.")];
    } else {
      return [t("")];
    }
}

function responseErrorMessage(jqXHR, messageMapFunc = null) {
   if (jqXHR instanceof Error) {
     console.log("Error: " + jqXHR);
     throw jqXHR;
   } else {
     console.log("Error: " + jqXHR.status + " " + jqXHR.statusText + ", response text: " + jqXHR.responseText);
   }

   if (jqXHR.responseJSON && jqXHR.responseJSON.messages &&
        Array.isArray(jqXHR.responseJSON.messages) &&
        jqXHR.responseJSON.messages.length > 0) {
      let msgs;
      if (messageMapFunc) {
        msgs = jqXHR.responseJSON.messages.map(msg => {
            let m = messageMapFunc(jqXHR.status, msg);
            return m ? m : msg;
        })
      } else {
        msgs = jqXHR.responseJSON.messages;
      }

      return MessagesUtils.error(msgs);
   } else {
      let msg = errorMessageByStatus(jqXHR.status);
      if (msg.length === 0) {
        msg = "Server error, please check log files.";
      }
      return MessagesUtils.error(msg);
   }
}

const Network = {
    get : get,
    post : post,
    put : put,
    del : del,
    errorMessageByStatus : errorMessageByStatus, 
    responseErrorMessage : responseErrorMessage
}

export default Network;