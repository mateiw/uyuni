/**
 * Copyright (c) 2020 SUSE LLC
 * <p>
 * This software is licensed to you under the GNU General Public License,
 * version 2 (GPLv2). There is NO WARRANTY for this software, express or
 * implied, including the implied warranties of MERCHANTABILITY or FITNESS
 * FOR A PARTICULAR PURPOSE. You should have received a copy of GPLv2
 * along with this software; if not, see
 * http://www.gnu.org/licenses/old-licenses/gpl-2.0.txt.
 * <p>
 * Red Hat trademarks are not licensed under GPLv2. No permission is
 * granted to use or replicate Red Hat trademarks that are incorporated
 * in this software or its documentation.
 */

package com.suse.manager.clusters;

public class ClusterNode {

    private String hostname;

    public ClusterNode(String hostname) {
        this.hostname = hostname;
    }

    /**
     * @return hostname to get
     */
    public String getHostname() {
        return hostname;
    }

    /**
     * @param hostnameIn to set
     */
    public void setHostname(String hostnameIn) {
        this.hostname = hostnameIn;
    }
}
