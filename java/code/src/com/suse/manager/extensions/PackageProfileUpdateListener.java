package com.suse.manager.extensions;

import com.redhat.rhn.domain.server.Server;
import org.pf4j.ExtensionPoint;

public interface PackageProfileUpdateListener extends ExtensionPoint {

    void onProfileUpdate(Server server);

}
