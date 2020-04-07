/**
 * Copyright (c) 2020 SUSE LLC
 *
 * This software is licensed to you under the GNU General Public License,
 * version 2 (GPLv2). There is NO WARRANTY for this software, express or
 * implied, including the implied warranties of MERCHANTABILITY or FITNESS
 * FOR A PARTICULAR PURPOSE. You should have received a copy of GPLv2
 * along with this software; if not, see
 * http://www.gnu.org/licenses/old-licenses/gpl-2.0.txt.
 *
 * Red Hat trademarks are not licensed under GPLv2. No permission is
 * granted to use or replicate Red Hat trademarks that are incorporated
 * in this software or its documentation.
 */

package com.suse.manager.webui.controllers.clusters.mappers;

import com.redhat.rhn.domain.server.MinionServer;
import com.suse.manager.model.clusters.Cluster;
import com.suse.manager.model.clusters.ClusterType;
import com.suse.manager.webui.controllers.clusters.response.ClusterResponse;
import com.suse.manager.webui.controllers.clusters.response.ClusterTypeResponse;
import com.suse.manager.webui.controllers.clusters.response.ServerResponse;

public class ResponseMappers {

    public static ClusterResponse toClusterResponse(Cluster cluster) {
        ClusterResponse response = new ClusterResponse();
        response.setId(cluster.getId());
        response.setName(cluster.getName());
        response.setType(toClusterTypeResponse(cluster.getType()));
        response.setManagementNode(toServerResponse(cluster.getManagementNode()));
        return response;
    }

    public static ServerResponse toServerResponse(MinionServer server) {
        ServerResponse response = new ServerResponse();
        response.setId(server.getId());
        response.setName(server.getName());
        return response;
    }

    public static ClusterTypeResponse toClusterTypeResponse(ClusterType clusterType) {
        ClusterTypeResponse response = new ClusterTypeResponse();
        response.setId(clusterType.getId());
        response.setLabel(clusterType.getLabel());
        response.setName(clusterType.getName());
        response.setDescription(clusterType.getDescription());
        return response;
    }

}
