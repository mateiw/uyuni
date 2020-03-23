// @flow
import { hot } from 'react-hot-loader';
import React, {useEffect} from 'react';
import withPageWrapper from 'components/general/with-page-wrapper';
import useClustersApi from '../shared/api/use-clusters-api';
import {TopPanel} from "../../../components/panels/TopPanel";
import {LinkButton} from 'components/buttons';
import useRoles from "core/auth/use-roles";
import {isOrgAdmin} from "core/auth/auth.utils";
import {Table} from 'components/table/Table';
import {Column} from 'components/table/Column';
import {SearchField} from 'components/table/SearchField';
import Functions from 'utils/functions';

import type {ClusterType} from '../shared/api/use-clusters-api';

type Props = {
  clusters: Array<ClusterType>,
  flashMessage: String,
};

const ListClusters = (props) => {
    const { fetchClusters } = useClustersApi();

    const roles = useRoles();
    const hasEditingPermissions = isOrgAdmin(roles);
    const panelButtons = (
        <div className="pull-right btn-group">
        {
            hasEditingPermissions &&
            <LinkButton
                id="addcluster"
                icon="fa-plus"
                className="btn-link js-spa"
                title={t('Import an existing cluster')}
                text={t('Import cluster')}
                href="/rhn/manager/clusters/import"
            />
        }
        </div>
    );

    const filterFunc = (row, criteria) => {
        const keysToSearch = ['name', 'type'];
        if (criteria) {
            return keysToSearch.map(key => row[key]).join().toLowerCase().includes(criteria.toLowerCase());
        }
        return true;
    };

    return (
        <TopPanel title={t('Clusters')}
            icon="spacewalk-icon-lifecycle" button={panelButtons}
            helpUrl="/docs/reference/clusters/clusters-menu.html">
            <Table
                data={props.clusters}
                identifier={row => row.label}
                initialSortColumnKey="name"
                searchField={(
                    <SearchField
                    filter={filterFunc}
                    placeholder={t('Filter by any value')}
                    />
                )}
                >
                <Column
                    columnKey="name"
                    comparator={Functions.Utils.sortByText}
                    header={t('Name')}
                    cell={row =>
                    <a
                        className="js-spa"
                        href={`/rhn/manager/clusters/${row.id}`}>
                        {row.name}
                    </a>
                    }
                />
                <Column
                    columnKey="type"
                    comparator={Functions.Utils.sortByText}
                    header={t('Type')}
                    cell={row => row.type}
                />
            </Table>
        </TopPanel>);

}

export default hot(module)(withPageWrapper<Props>(ListClusters));