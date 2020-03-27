import React from 'react';
import SpaRenderer from "core/spa/spa-renderer";
import {RolesProvider} from "core/auth/roles-context";
import Cluster from './cluster';

export const renderer = (id, {cluster, flashMessage} = {}) => {

  let clusterJson = {};
  try{
    clusterJson = JSON.parse(cluster);
  } catch(error) {
      console.log(error);
  }

  SpaRenderer.renderNavigationReact(
    <RolesProvider>
      <Cluster cluster={clusterJson} flashMessage={flashMessage}/>
    </RolesProvider>,
    document.getElementById(id)
  );
 
};