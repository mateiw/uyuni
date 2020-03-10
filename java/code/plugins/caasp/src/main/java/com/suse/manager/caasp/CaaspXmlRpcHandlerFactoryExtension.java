/**
 * Copyright (c) 2016 SUSE LLC
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
package com.suse.manager.caasp;

import com.redhat.rhn.common.util.manifestfactory.ClassBuilder;
import com.redhat.rhn.common.util.manifestfactory.ManifestFactoryBuilder;
import com.suse.manager.extensions.XmlRpcHandlerFactoryExtensionPoint;
import org.pf4j.Extension;

@Extension
public class CaaspXmlRpcHandlerFactoryExtension implements XmlRpcHandlerFactoryExtensionPoint {

    @Override
    public ManifestFactoryBuilder getBuilder() {
        return new ClassBuilder(this, "com.suse.manager.caasp", "xmlrpc-handlers.xml");
    }

}
