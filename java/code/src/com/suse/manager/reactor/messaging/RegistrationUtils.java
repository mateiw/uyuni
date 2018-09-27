/**
 * Copyright (c) 2018 SUSE LLC
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

package com.suse.manager.reactor.messaging;

import com.redhat.rhn.common.messaging.MessageQueue;
import com.redhat.rhn.common.validator.ValidatorResult;
import com.redhat.rhn.domain.channel.Channel;
import com.redhat.rhn.domain.entitlement.Entitlement;
import com.redhat.rhn.domain.product.SUSEProduct;
import com.redhat.rhn.domain.product.SUSEProductChannel;
import com.redhat.rhn.domain.product.SUSEProductFactory;
import com.redhat.rhn.domain.server.MinionServer;
import com.redhat.rhn.domain.server.ServerFactory;
import com.redhat.rhn.domain.state.PackageState;
import com.redhat.rhn.domain.state.PackageStates;
import com.redhat.rhn.domain.state.ServerStateRevision;
import com.redhat.rhn.domain.state.StateFactory;
import com.redhat.rhn.domain.state.VersionConstraints;
import com.redhat.rhn.domain.token.ActivationKey;
import com.redhat.rhn.domain.token.ActivationKeyFactory;
import com.redhat.rhn.domain.user.User;
import com.redhat.rhn.manager.action.ActionManager;
import com.redhat.rhn.manager.system.SystemManager;
import com.redhat.rhn.taskomatic.TaskomaticApiException;
import com.suse.manager.reactor.utils.RhelUtils;
import com.suse.manager.reactor.utils.ValueMap;
import com.suse.manager.webui.controllers.StatesAPI;
import com.suse.manager.webui.services.SaltStateGeneratorService;
import com.suse.manager.webui.services.impl.SaltService;
import com.suse.manager.webui.utils.salt.custom.PkgProfileUpdateSlsResult;
import com.suse.salt.netapi.calls.modules.State;
import com.suse.salt.netapi.calls.modules.Zypper;
import com.suse.salt.netapi.results.CmdExecCodeAll;
import com.suse.utils.Opt;
import org.apache.log4j.Logger;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Stream;

import static java.util.Collections.emptyList;
import static java.util.Optional.ofNullable;
import static java.util.stream.Collectors.partitioningBy;
import static java.util.stream.Collectors.toSet;

/**
 * Common registration logic that can be used from multiple places
 */
public class RegistrationUtils {

    private static final List<String> BLACKLIST = Collections.unmodifiableList(
            Arrays.asList("rhncfg", "rhncfg-actions", "rhncfg-client", "rhn-virtualization-host", "osad")
    );

    private static final String OS = "os";

    private static final Logger LOG = Logger.getLogger(RegistrationUtils.class);


    /**
     * Prevent instantiation.
     */
    private RegistrationUtils() {  }

    /**
     * Perform the final registration steps for the minion.
     *
     * @param minion the minion
     * @param activationKey the activation key
     * @param creator user performing the registration
     * @param enableMinionService true if salt-minion service should be enabled and running
     */
    public static void finishRegistration(MinionServer minion, Optional<ActivationKey> activationKey,
            Optional<User> creator, boolean enableMinionService) {
        String minionId = minion.getMinionId();
        // get hardware and network async
        triggerHardwareRefresh(minion);

        LOG.info("Finished minion registration: " + minionId);

        StatesAPI.generateServerPackageState(minion);

        // Asynchronously get the uptime of this minion
        MessageQueue.publish(new MinionStartEventDatabaseMessage(minionId));

        // Generate pillar data
        try {
            SaltStateGeneratorService.INSTANCE.generatePillar(minion);

            // Subscribe to config channels assigned to the activation key or initialize empty channel profile
            minion.subscribeConfigChannels(
                    activationKey.map(ActivationKey::getAllConfigChannels).orElse(emptyList()),
                    creator.orElse(null));
        }
        catch (RuntimeException e) {
            LOG.error("Error generating Salt files for minion '" + minionId + "':" + e.getMessage());
        }

        // Should we apply the highstate?
        boolean applyHighstate = activationKey.isPresent() && activationKey.get().getDeployConfigs();

        // Apply initial states asynchronously
        List<String> statesToApply = new ArrayList<>();
        statesToApply.add(ApplyStatesEventMessage.CERTIFICATE);
        statesToApply.add(ApplyStatesEventMessage.CHANNELS);
        statesToApply.add(ApplyStatesEventMessage.CHANNELS_DISABLE_LOCAL_REPOS);
        statesToApply.add(ApplyStatesEventMessage.PACKAGES);
        if (enableMinionService) {
            statesToApply.add(ApplyStatesEventMessage.SALT_MINION_SERVICE);
        }
        MessageQueue.publish(new ApplyStatesEventMessage(
                minion.getId(),
                minion.getCreator() != null ? minion.getCreator().getId() : null,
                !applyHighstate, // Refresh package list if we're not going to apply the highstate afterwards
                statesToApply
        ));

        // Call final highstate to deploy config channels if required
        if (applyHighstate) {
            MessageQueue.publish(new ApplyStatesEventMessage(minion.getId(), true, emptyList()));
        }
    }

    private static void triggerHardwareRefresh(MinionServer server) {
        try {
            ActionManager.scheduleHardwareRefreshAction(server.getOrg(), server, new Date());
        }
        catch (TaskomaticApiException e) {
            LOG.error("Could not schedule hardware refresh for system: " + server.getId());
            throw new RuntimeException(e);
        }
    }

    /**
     * Assigns various assets to a minion based on given activation key
     * @param activationKey the activation key
     * @param minion the minion
     * @param grains the grains
     */
    public static void applyActivationKey(ActivationKey activationKey, MinionServer minion, ValueMap grains) {
        activationKey.getToken().getActivatedServers().add(minion);
        ActivationKeyFactory.save(activationKey);

        activationKey.getServerGroups().forEach(group -> ServerFactory.addServerToGroup(minion, group));

        ServerStateRevision serverStateRevision = new ServerStateRevision();
        serverStateRevision.setServer(minion);
        serverStateRevision.setCreator(activationKey.getCreator());
        serverStateRevision.setPackageStates(
                activationKey.getPackages().stream()
                        .filter(p -> !BLACKLIST.contains(p.getPackageName().getName()))
                        .map(tp -> {
                            PackageState state = new PackageState();
                            state.setArch(tp.getPackageArch());
                            state.setName(tp.getPackageName());
                            state.setPackageState(PackageStates.INSTALLED);
                            state.setVersionConstraint(VersionConstraints.ANY);
                            state.setStateRevision(serverStateRevision);
                            return state;
                        }).collect(toSet())
        );
        StateFactory.save(serverStateRevision);

        // Set additional entitlements, if any
        Set<Entitlement> validEntits = minion.getOrg().getValidAddOnEntitlementsForOrg();
        activationKey.getToken().getEntitlements().forEach(sg -> {
            Entitlement e = sg.getAssociatedEntitlement();
            if (validEntits.contains(e) &&
                    e.isAllowedOnServer(minion, grains) &&
                    SystemManager.canEntitleServer(minion, e)) {
                ValidatorResult vr = SystemManager.entitleServer(minion, e);
                if (vr.getWarnings().size() > 0) {
                    LOG.warn(vr.getWarnings().toString());
                }
                if (vr.getErrors().size() > 0) {
                    LOG.error(vr.getErrors().toString());
                }
            }
        });
    }

    /**
     * Subscribes minion to channels
     *
     * @param saltService the Salt service instance
     * @param server the minion
     * @param grains the grains
     * @param activationKey the activation key
     * @param activationKeyLabel the activation key label
     */
    public static void subscribeMinionToChannels(SaltService saltService, MinionServer server,
            ValueMap grains, Optional<ActivationKey> activationKey, Optional<String> activationKeyLabel) {
        String minionId = server.getMinionId();

        if (!activationKey.isPresent() && activationKeyLabel.isPresent()) {
            LOG.warn("Default channel(s) will NOT be subscribed to: specified Activation Key " +
                    activationKeyLabel.get() + " is not valid for minionId " + minionId);
            SystemManager.addHistoryEvent(server, "Invalid Activation Key",
                    "Specified Activation Key " + activationKeyLabel.get() +
                            " is not valid. Default channel(s) NOT subscribed to.");
            return;
        }

        Set<Channel> channelsToAssign = Opt.fold(
                activationKey,
                // No ActivationKey
                () -> {
                    Set<SUSEProduct> suseProducts = identifyProduct(saltService, server, grains);
                    Map<Boolean, List<SUSEProduct>> baseAndExtProd = suseProducts.stream()
                            .collect(partitioningBy(SUSEProduct::isBase));

                    Optional<SUSEProduct> baseProductOpt = ofNullable(baseAndExtProd.get(true))
                            .flatMap(s -> s.stream().findFirst());
                    List<SUSEProduct> extProducts = baseAndExtProd.get(false);

                    return Opt.fold(
                            baseProductOpt,
                            // No ActivationKey and no base product identified
                            () -> {
                                LOG.warn("Server " + minionId + " has no identifiable base product" +
                                        " and will register without base channel assignment");
                                return Collections.emptySet();
                            },
                            baseProduct -> Stream.concat(
                                    lookupRequiredChannelsForProduct(baseProduct),
                                    extProducts.stream()
                                            .flatMap(ext -> recommendedChannelsByBaseProduct(baseProduct, ext))
                            ).collect(toSet())
                    );
                },
                ak -> Opt.<Channel, Set<Channel>>fold(
                        ofNullable(ak.getBaseChannel()),
                        // ActivationKey without base channel (SUSE Manager Default)
                        () -> {
                            Set<SUSEProduct> suseProducts = identifyProduct(saltService, server, grains);
                            Map<Boolean, List<SUSEProduct>> baseAndExtProd = suseProducts.stream()
                                    .collect(partitioningBy(SUSEProduct::isBase));

                            Optional<SUSEProduct> baseProductOpt = ofNullable(baseAndExtProd.get(true))
                                    .flatMap(s -> s.stream().findFirst());
                            List<SUSEProduct> extProducts = baseAndExtProd.get(false);

                            return Opt.fold(
                                    baseProductOpt,
                                    // ActivationKey and no base product identified
                                    () -> {
                                        LOG.warn("Server " + minionId + " has no identifiable base product" +
                                                " and will register without base channel assignment");
                                        return Collections.emptySet();
                                    },
                                    baseProduct -> Stream.concat(
                                            lookupRequiredChannelsForProduct(baseProduct),
                                            extProducts.stream().flatMap(
                                                    ext -> recommendedChannelsByBaseProduct(baseProduct, ext))
                                    ).collect(toSet())
                            );
                        },
                        baseChannel -> Opt.fold(
                                SUSEProductFactory.findProductByChannelLabel(baseChannel.getLabel()),
                                () -> {
                                    // ActivationKey with custom channel
                                    return Stream.concat(
                                            Stream.of(baseChannel),
                                            ak.getChannels().stream()
                                    ).collect(toSet());
                                },
                                baseProduct -> {
                                    // ActivationKey with vendor or cloned vendor channel
                                    return Stream.concat(
                                            lookupRequiredChannelsForProduct(baseProduct.getProduct()),
                                            ak.getChannels().stream()
                                                    .filter(c -> c.getParentChannel() != null &&
                                                            c.getParentChannel().getId().equals(baseChannel.getId()))
                                    ).collect(toSet());
                                }
                        )
                )
        );

        channelsToAssign.forEach(server::addChannel);
    }

    private static Set<SUSEProduct> identifyProduct(SaltService saltService, MinionServer server, ValueMap grains) {
        if ("suse".equalsIgnoreCase(grains.getValueAsString(OS))) {
            Optional<List<Zypper.ProductInfo>> productList =
                    saltService.callSync(Zypper.listProducts(false), server.getMinionId());
            return Opt.stream(productList).flatMap(pl -> pl.stream()
                    .flatMap(pi -> {
                        String osName = pi.getName().toLowerCase();
                        String osVersion = pi.getVersion();
                        String osArch = pi.getArch();
                        String osRelease = pi.getRelease();
                        Optional<SUSEProduct> suseProduct =
                                ofNullable(SUSEProductFactory.findSUSEProduct(osName,
                                        osVersion, osRelease, osArch, true));
                        if (!suseProduct.isPresent()) {
                            LOG.warn("No product match found for: " + osName + " " +
                                    osVersion + " " + osRelease + " " + osArch);
                        }
                        return Opt.stream(suseProduct);
                    })).collect(toSet());
        }
        else if ("redhat".equalsIgnoreCase(grains.getValueAsString(OS)) ||
                "centos".equalsIgnoreCase(grains.getValueAsString(OS))) {
            Optional<Map<String, State.ApplyResult>> applyResultMap = saltService
                    .applyState(server.getMinionId(), "packages.redhatproductinfo");
            Optional<String> centosReleaseContent = applyResultMap.map(
                    map -> map.get(PkgProfileUpdateSlsResult.PKG_PROFILE_CENTOS_RELEASE))
                    .map(r -> r.getChanges(CmdExecCodeAll.class)).map(c -> c.getStdout());
            Optional<String> rhelReleaseContent = applyResultMap.map(
                    map -> map.get(PkgProfileUpdateSlsResult.PKG_PROFILE_REDHAT_RELEASE))
                    .map(r -> r.getChanges(CmdExecCodeAll.class)).map(c -> c.getStdout());
            Optional<String> whatProvidesRes = applyResultMap.map(map -> map
                    .get(PkgProfileUpdateSlsResult.PKG_PROFILE_WHATPROVIDES_SLES_RELEASE))
                    .map(r -> r.getChanges(CmdExecCodeAll.class)).map(c -> c.getStdout());

            Optional<RhelUtils.RhelProduct> rhelProduct = RhelUtils.detectRhelProduct(
                    server, whatProvidesRes, rhelReleaseContent, centosReleaseContent);
            return Opt.stream(rhelProduct).flatMap(rhel -> {
                if (rhel.getSuseProduct().isPresent()) {
                    return Opt.stream(rhel.getSuseProduct());
                }
                else {
                    LOG.warn("No product match found for: " + rhel.getName() + " " +
                            rhel.getVersion() + " " + rhel.getRelease() + " " +
                            server.getServerArch().getCompatibleChannelArch());
                    return Stream.empty();
                }
            }).collect(toSet());
        }
        return Collections.emptySet();
    }

    private static Stream<Channel> lookupRequiredChannelsForProduct(SUSEProduct sp) {
        return recommendedChannelsByBaseProduct(sp);
    }

    private static Stream<Channel> recommendedChannelsByBaseProduct(SUSEProduct base) {
            return recommendedChannelsByBaseProduct(base, base);
    }

    private static Stream<Channel> recommendedChannelsByBaseProduct(SUSEProduct root, SUSEProduct base) {
        return root.getSuseProductChannels().stream()
                .filter(c -> c.getParentChannelLabel() == null)
                .map(SUSEProductChannel::getChannelLabel)
                .findFirst().map(rootChannelLabel -> {
                    List<SUSEProduct> allExtensionProductsOf = SUSEProductFactory.findAllExtensionProductsOf(base);

                    Stream<Channel> channelStream = SUSEProductFactory.findAllSUSEProductChannels().stream()
                            .filter(pc -> pc.getProduct().equals(base))
                            .map(SUSEProductChannel::getChannel)
                            .filter(Objects::nonNull)
                            .filter(c -> c.getParentChannel() == null ||
                                    c.getParentChannel().getLabel().equals(rootChannelLabel));

                    Stream<Channel> stream = allExtensionProductsOf.stream().flatMap(ext ->
                            SUSEProductFactory.findSUSEProductExtension(root, base, ext).map(pe -> {
                                if (pe.isRecommended()) {
                                    return recommendedChannelsByBaseProduct(root, ext);
                                }
                                else {
                                    return Stream.<Channel>empty();
                                }
                    }).orElseGet(Stream::empty));

                    return Stream.concat(
                            channelStream,
                            stream
                    );
                }).orElseGet(Stream::empty);
    }
}