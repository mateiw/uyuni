import React from 'react';
import ClustersOverview from './list-clusters';
import {RolesProvider} from "core/auth/roles-context";
import SpaRenderer from "core/spa/spa-renderer";

export const renderer = (id, {clusters, flashMessage}) => {

  let clustersJson = [];
  try{
    clustersJson = JSON.parse(clusters);
  }  catch(error) {}

  SpaRenderer.renderNavigationReact(
    <RolesProvider>
      <ClustersOverview clusters={clustersJson} flashMessage={flashMessage}/>
    </RolesProvider>,
    document.getElementById(id)
  );
 
};