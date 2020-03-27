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

package com.suse.manager.clusters;

import com.suse.manager.model.clusters.Cluster;
import com.suse.manager.model.clusters.ClusterType;

import java.util.Arrays;
import java.util.List;

import static com.redhat.rhn.common.hibernate.HibernateFactory.getSession;

public class ClusterManager {

    private static volatile ClusterManager instance = null;

    public static ClusterManager instance() {
        if (instance == null) {
            synchronized (ClusterManager.class) {
                if (instance == null) {
                    instance = new ClusterManager();
                }
            }
        }
        return instance;
    }

    public void save(Cluster cluster) {
        getSession().save(cluster);
    }

    public void save(ClusterType type) {
        getSession().save(type);
    }

    public List<Cluster> findAllClusters() {
        return getSession().createNamedQuery("Clusters.findAll").list();
    }

    public List<ClusterType> findAllClusterTypes() {
        return getSession().createNamedQuery("ClusterTypes.findAll").list();
    }

    public Cluster getCluster(long id) {
        return getSession().get(Cluster.class, id);
    }

    public List<ClusterNode> getNodes(long id) {
        // TODO call cluster provider to get nodes
        try {
            Thread.sleep(1000);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
        return Arrays.asList(new ClusterNode("node1"), new ClusterNode("node2"));
    }
}
