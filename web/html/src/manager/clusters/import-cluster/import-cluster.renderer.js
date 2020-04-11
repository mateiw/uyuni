import React from 'react';
import SpaRenderer from "core/spa/spa-renderer";
import {RolesProvider} from "core/auth/roles-context";
import {UserLocalizationProvider} from "core/user-localization/user-localization-context"
import ImportCluster from './import-cluster';

export const renderer = (id, {contentImport, flashMessage} = {}) => {
  let availableTypesJson = {};
  try{
    availableTypesJson = JSON.parse(contentImport);
  } catch(error) {
      console.log(error);
  }

  SpaRenderer.renderNavigationReact(
    <RolesProvider>
      <UserLocalizationProvider>
        <ImportCluster availableProviders={availableTypesJson} flashMessage={flashMessage}/>
      </UserLocalizationProvider>  
    </RolesProvider>,
    document.getElementById(id)
  );
 
};
