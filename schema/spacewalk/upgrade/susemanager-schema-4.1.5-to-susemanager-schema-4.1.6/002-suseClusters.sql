-- Copyright (c) 2020 SUSE LLC
--
-- This software is licensed to you under the GNU General Public License,
-- version 2 (GPLv2). There is NO WARRANTY for this software, express or
-- implied, including the implied warranties of MERCHANTABILITY or FITNESS
-- FOR A PARTICULAR PURPOSE. You should have received a copy of GPLv2
-- along with this software; if not, see
-- http://www.gnu.org/licenses/old-licenses/gpl-2.0.txt.
--
-- Red Hat trademarks are not licensed under GPLv2. No permission is
-- granted to use or replicate Red Hat trademarks that are incorporated
-- in this software or its documentation.
--

--DROP TABLE IF EXISTS suseClusters;
--DROP SEQUENCE IF EXISTS suse_cluster_id_seq;
--
--DROP TABLE IF EXISTS suseClusterTypes;
--DROP SEQUENCE IF EXISTS suse_clustertypes_id_seq;


CREATE TABLE IF NOT EXISTS suseClusterTypes (
    id          NUMERIC NOT NULL
                    CONSTRAINT suse_clustertypes_id_pk PRIMARY KEY,
    label       VARCHAR(100) NOT NULL,
    name        VARCHAR(256) NOT NULL,
    description VARCHAR(256) NOT NULL
);

CREATE SEQUENCE IF NOT EXISTS suse_clustertypes_id_seq;

CREATE UNIQUE INDEX IF NOT EXISTS suse_clustertypes_idx
    ON suseClusterTypes (name);

CREATE TABLE IF NOT EXISTS suseClusters (
    id          NUMERIC NOT NULL
                    CONSTRAINT suse_clusters_id_pk PRIMARY KEY,
    name        VARCHAR(256) NOT NULL,
    type_id     NUMERIC NOT NULL
                    CONSTRAINT suse_clusters_type_fk
                    REFERENCES suseClusterTypes (id),
    management_node_id    NUMERIC
                        CONSTRAINT suse_clusters_mgmt_node_fk
                        REFERENCES rhnServer (id)
                        ON DELETE CASCADE,
    created     TIMESTAMPTZ
                     DEFAULT (current_timestamp) NOT NULL,
    modified    TIMESTAMPTZ
                     DEFAULT (current_timestamp) NOT NULL
);

CREATE SEQUENCE IF NOT EXISTS suse_cluster_id_seq;

CREATE UNIQUE INDEX IF NOT EXISTS suse_cluster_idx
    ON suseClusters (name);

