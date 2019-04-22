import React from 'react';
import ReactDOM from 'react-dom';
import ListFilters from './list-filters';
import "./list-filters.css";

window.pageRenderers = window.pageRenderers || {};
window.pageRenderers.contentManagement = window.pageRenderers.contentManagement || {};
window.pageRenderers.contentManagement.listFilters = window.pageRenderers.contentManagement.listFilters || {};
window.pageRenderers.contentManagement.listFilters.renderer = (id, {filters, openFilterId, flashMessage}) => {

  console.log(openFilterId);

  let filtersJson = [];
  try{
    filtersJson = JSON.parse(filters);
  }  catch(error) {}

  ReactDOM.render(
      <ListFilters
        filters={filtersJson}
        openFilterId={openFilterId}
        flashMessage={flashMessage}
      />,
      document.getElementById(id),
    );
};