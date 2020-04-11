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

package com.suse.manager.model.clusters.test;

import com.redhat.rhn.domain.server.MinionServer;
import com.redhat.rhn.domain.server.test.MinionServerFactoryTest;
import com.redhat.rhn.testing.BaseTestCaseWithUser;
import com.suse.manager.clusters.ClusterManager;
import com.suse.manager.model.clusters.Cluster;
import com.suse.manager.model.clusters.ClusterType;

import java.util.List;

import static com.redhat.rhn.common.hibernate.HibernateFactory.getSession;

public class ClusterTest extends BaseTestCaseWithUser {

    public void testSave() throws Exception {
        MinionServer server = MinionServerFactoryTest.createTestMinionServer(user);

        ClusterType type = new ClusterType();
        type.setName("caasp");

        Cluster cluster = new Cluster();
        cluster.setName("test");
        cluster.setType(type);
        cluster.setManagementNode(server);

        ClusterManager manager = new ClusterManager();
        manager.save(cluster);

        assertTrue(cluster.getId() > 0);
    }

    public void testFindAllClusterTypes() throws Exception {
        ClusterType type1 = new ClusterType();
        type1.setName("type 1");

        ClusterType type2 = new ClusterType();
        type2.setName("type 2");

        ClusterManager manager = new ClusterManager();
        manager.save(type1);
        manager.save(type2);

        getSession().flush();
        getSession().clear();

        List<ClusterType> types = manager.findAllClusterTypes();
        assertEquals(2, types.size());
    }

    public void testFindAllClusters() throws Exception {
        MinionServer server = MinionServerFactoryTest.createTestMinionServer(user);

        ClusterType type = new ClusterType();
        type.setName("caasp");

        Cluster cluster = new Cluster();
        cluster.setName("test");
        cluster.setType(type);
        cluster.setManagementNode(server);

        ClusterManager manager = new ClusterManager();
        manager.save(type);
        manager.save(cluster);

        List<Cluster> clusters = manager.findAllClusters(user.getOrg().getId());
        assertEquals(1, clusters.size());
    }

}
