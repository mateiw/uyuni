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

package com.suse.manager.model.clusters;

import com.redhat.rhn.domain.server.MinionServer;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.FetchType;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.JoinColumn;
import javax.persistence.ManyToOne;
import javax.persistence.NamedQueries;
import javax.persistence.NamedQuery;
import javax.persistence.SequenceGenerator;
import javax.persistence.Table;

@Entity
@Table(name = "suseClusters")
@NamedQueries
        ({
                @NamedQuery(name = "Clusters.findAll", query = "from com.suse.manager.model.clusters.Cluster")
        })
public class Cluster {

    private long id;
    private String name;
    private ClusterType type;
    private MinionServer managementNode;


    /**
     * @return id to get
     */
    @Id
    @Column(name = "id")
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "clust_seq")
    @SequenceGenerator(name = "clust_seq", sequenceName = "suse_cluster_id_seq",
            allocationSize = 1)
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
    @Column(name = "name")
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
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "type_id")
    public ClusterType getType() {
        return type;
    }

    /**
     * @param typeIn to set
     */
    public void setType(ClusterType typeIn) {
        this.type = typeIn;
    }

    /**
     * @return managementNode to get
     */
    @ManyToOne
    @JoinColumn(name = "management_node_id")
    public MinionServer getManagementNode() {
        return managementNode;
    }

    /**
     * @param managementNodeIn to set
     */
    public void setManagementNode(MinionServer managementNodeIn) {
        this.managementNode = managementNodeIn;
    }
}
