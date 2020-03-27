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

package com.suse.manager.webui.controllers.clusters.response;

public class ClusterResponse {

    private long id;
    private String name;
    private ClusterTypeResponse type;
    private ServerResponse managementNode;

    /**
     * @return id to get
     */
    public long getId() {
        return id;
    }

    /**
     * @param idIn to set
     */
    public void setId(long idIn) {
        this.id = idIn;
    }

    /**
     * @return name to get
     */
    public String getName() {
        return name;
    }

    /**
     * @param nameIn to set
     */
    public void setName(String nameIn) {
        this.name = nameIn;
    }

    /**
     * @return type to get
     */
    public ClusterTypeResponse getType() {
        return type;
    }

    /**
     * @param typeIn to set
     */
    public void setType(ClusterTypeResponse typeIn) {
        this.type = typeIn;
    }

    /**
     * @return managementNode to get
     */
    public ServerResponse getManagementNode() {
        return managementNode;
    }

    /**
     * @param managementNodeIn to set
     */
    public void setManagementNode(ServerResponse managementNodeIn) {
        this.managementNode = managementNodeIn;
    }

}
