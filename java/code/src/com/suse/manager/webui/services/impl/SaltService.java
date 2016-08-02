/**
 * Copyright (c) 2015 SUSE LLC
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
package com.suse.manager.webui.services.impl;

import com.redhat.rhn.domain.server.MinionServer;
import com.redhat.rhn.domain.server.MinionServerFactory;
import com.redhat.rhn.domain.state.StateFactory;
import com.redhat.rhn.domain.user.User;

import com.google.gson.reflect.TypeToken;
import com.suse.manager.webui.services.SaltCustomStateStorageManager;
import com.suse.manager.webui.services.SaltStateGeneratorService;
import com.suse.manager.webui.utils.salt.custom.MainframeSysinfo;
import com.suse.manager.webui.utils.salt.custom.SumaUtil;
import com.suse.manager.webui.utils.salt.custom.Udevdb;
import com.suse.salt.netapi.AuthModule;
import com.suse.salt.netapi.calls.LocalAsyncResult;
import com.suse.salt.netapi.calls.LocalCall;
import com.suse.salt.netapi.calls.RunnerCall;
import com.suse.salt.netapi.calls.SaltSSHConfig;
import com.suse.salt.netapi.calls.WheelResult;
import com.suse.salt.netapi.calls.modules.Cmd;
import com.suse.salt.netapi.calls.modules.Grains;
import com.suse.salt.netapi.calls.modules.Match;
import com.suse.salt.netapi.calls.modules.Network;
import com.suse.salt.netapi.calls.modules.SaltUtil;
import com.suse.salt.netapi.calls.modules.Schedule;
import com.suse.salt.netapi.calls.modules.Smbios;
import com.suse.salt.netapi.calls.modules.Status;
import com.suse.salt.netapi.calls.modules.Test;
import com.suse.salt.netapi.calls.modules.Timezone;
import com.suse.salt.netapi.calls.runner.Jobs;
import com.suse.salt.netapi.calls.wheel.Key;
import com.suse.salt.netapi.client.SaltClient;
import com.suse.salt.netapi.config.ClientConfig;
import com.suse.salt.netapi.datatypes.target.Glob;
import com.suse.salt.netapi.datatypes.target.MinionList;
import com.suse.salt.netapi.datatypes.target.Target;
import com.suse.salt.netapi.event.EventStream;
import com.suse.salt.netapi.exception.SaltException;
import com.suse.salt.netapi.results.Result;
import com.suse.salt.netapi.results.SSHResult;
import com.suse.utils.Opt;
import org.apache.log4j.Logger;

import java.io.IOException;
import java.net.URI;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.time.ZonedDateTime;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.HashSet;
import java.util.stream.Stream;

/**
 * Singleton class acting as a service layer for accessing the salt API.
 */
public class SaltService {

    /**
     * Singleton instance of this class
     */
    public final static SaltService INSTANCE = new SaltService();

    // Logger
    private static final Logger LOG = Logger.getLogger(SaltService.class);

    // Salt properties
    private final URI SALT_MASTER_URI = URI.create("http://localhost:9080");
    private final String SALT_USER = "admin";
    private final String SALT_PASSWORD = "";
    private final AuthModule AUTH_MODULE = AuthModule.AUTO;

    // Shared salt client instance
    private final SaltClient SALT_CLIENT = new SaltClient(SALT_MASTER_URI);

    private SaltCustomStateStorageManager customSaltStorageManager =
            SaltCustomStateStorageManager.INSTANCE;

    // Prevent instantiation
    SaltService() {
        // Set unlimited timeout
        SALT_CLIENT.getConfig().put(ClientConfig.SOCKET_TIMEOUT, 0);
    }

    /**
     * Executes a salt function on a single minion.
     *
     * @param call salt function to call
     * @param minionId minion id to target
     * @param <R> result type of the salt function
     * @return Optional holding the result of the function
     * or none if the minion did not respond.
     */
    public <R> Optional<R> callSync(LocalCall<R> call, String minionId) {
        try {
            Map<String, Result<R>> stringRMap = call.callSync(SALT_CLIENT,
                    new MinionList(minionId), SALT_USER, SALT_PASSWORD, AUTH_MODULE);

            return Opt.fold(Optional.ofNullable(stringRMap.get(minionId)), () -> {
                LOG.warn("Got no result for " + call.getPayload().get("fun") +
                        " on minion " + minionId + " (minion did not respond in time)");
                return Optional.empty();
            }, r ->
                r.fold(error -> {
                    LOG.warn(error.toString());
                    return Optional.empty();
                }, Optional::of)
            );
        }
        catch (SaltException e) {
            throw new RuntimeException(e);
        }
    }

    /**
     * Executes a salt runner module function
     *
     * @param call salt function to call
     * @param <R> result type of the salt function
     * @return the result of the function
     */
    public <R> R callSync(RunnerCall<R> call) {
        try {
            return call.callSync(SALT_CLIENT, SALT_USER, SALT_PASSWORD, AUTH_MODULE);
        }
        catch (SaltException e) {
            throw new RuntimeException(e);
        }
    }

    /**
     * Get the minion keys from salt with their respective status.
     *
     * @return the keys with their respective status as returned from salt
     */
    public Key.Names getKeys() {
        try {
            WheelResult<Key.Names> result = Key.listAll()
                    .callSync(SALT_CLIENT, SALT_USER, SALT_PASSWORD, AUTH_MODULE);
            return result.getData().getResult();
        }
        catch (SaltException e) {
            throw new RuntimeException(e);
        }
    }

    /**
     * For a given id check if there is a minion key in any status.
     *
     * @param id the id to check for
     * @return true if there is a key with the given id, false otherwise
     */
    public boolean keyExists(String id) {
        Key.Names keys = getKeys();
        return keys.getMinions().contains(id) ||
                keys.getUnacceptedMinions().contains(id) ||
                keys.getRejectedMinions().contains(id) ||
                keys.getDeniedMinions().contains(id);
    }

    /**
     * Get the minion keys from salt with their respective status and fingerprint.
     *
     * @return the keys with their respective status and fingerprint as returned from salt
     */
    public Key.Fingerprints getFingerprints() {
        try {
            WheelResult<Key.Fingerprints> result = Key.finger("*")
                    .callSync(SALT_CLIENT, SALT_USER, SALT_PASSWORD, AUTH_MODULE);
            return result.getData().getResult();
        }
        catch (SaltException e) {
            throw new RuntimeException(e);
        }
    }

    /**
     * Generate a key pair for the given id and accept the public key.
     *
     * @param id the id to use
     * @param force set true to overwrite an already existing key
     * @return the generated key pair
     */
    public com.suse.manager.webui.utils.salt.Key.Pair generateKeysAndAccept(String id,
            boolean force) {
        try {
            WheelResult<com.suse.manager.webui.utils.salt.Key.Pair> result =
                    com.suse.manager.webui.utils.salt.Key.genAccept(id, Optional.of(force))
                    .callSync(SALT_CLIENT, SALT_USER, SALT_PASSWORD, AUTH_MODULE);
            return result.getData().getResult();
        }
        catch (SaltException e) {
            throw new RuntimeException(e);
        }
    }

    /**
     * Get the grains for a given minion.
     *
     * @param minionId id of the target minion
     * @return map containing the grains
     */
    public Optional<Map<String, Object>> getGrains(String minionId) {
        return callSync(Grains.items(false), minionId);
    }

    /**
     * Get the machine id for a given minion.
     *
     * @param minionId id of the target minion
     * @return the machine id as a string
     */
    public Optional<String> getMachineId(String minionId) {
        return getGrain(minionId, "machine_id").flatMap(grain -> {
          if (grain instanceof String) {
              return Optional.of((String) grain);
          }
          else {
              LOG.warn("Minion " + minionId + " returned non string: " +
                      grain + " as minion_id");
              return Optional.empty();
          }
        });
    }

    /**
     * Get the timezone offsets for a target, e.g. a list of minions.
     *
     * @param target the targeted minions
     * @return the timezone offsets of the targeted minions
     */
    public Map<String, Result<String>> getTimezoneOffsets(Target<?> target) {
        try {
            Map<String, Result<String>> offsets = Timezone.getOffset().callSync(
                    SALT_CLIENT, target, SALT_USER, SALT_PASSWORD, AUTH_MODULE);
            return offsets;
        }
        catch (SaltException e) {
            throw new RuntimeException(e);
        }
    }

    /**
     * Accept all keys matching the given pattern
     *
     * @param match a pattern for minion ids
     */
    public void acceptKey(String match) {
        try {
            Key.accept(match).callSync(SALT_CLIENT,
                    SALT_USER, SALT_PASSWORD, AUTH_MODULE);
        }
        catch (SaltException e) {
            throw new RuntimeException(e);
        }
    }

    /**
     * Delete a given minion's key.
     *
     * @param minionId id of the minion
     */
    public void deleteKey(String minionId) {
        try {
            Key.delete(minionId).callSync(SALT_CLIENT,
                    SALT_USER, SALT_PASSWORD, AUTH_MODULE);
        }
        catch (SaltException e) {
            throw new RuntimeException(e);
        }
    }

    /**
     * Reject a given minion's key.
     *
     * @param minionId id of the minion
     */
    public void rejectKey(String minionId) {
        try {
            Key.reject(minionId).callSync(SALT_CLIENT,
                    SALT_USER, SALT_PASSWORD, AUTH_MODULE);
        }
        catch (SaltException e) {
            throw new RuntimeException(e);
        }
    }

    /**
     * Return the stream of events happening in salt.
     *
     * @return the event stream
     */
    // Do not use the shared client object here, so we can disable the timeout (set to 0).
    public EventStream getEventStream() {
        try {
            SaltClient client = new SaltClient(SALT_MASTER_URI);
            client.login(SALT_USER, SALT_PASSWORD, AUTH_MODULE);
            client.getConfig().put(ClientConfig.SOCKET_TIMEOUT, 0);
            return new EventStream(client.getConfig());
        }
        catch (SaltException e) {
            throw new RuntimeException(e);
        }
    }

    /**
     * Get a given grain's value from a given minion.
     *
     * @param minionId id of the target minion
     * @param grain name of the grain
     * @return the grain value
     */
    private Optional<Object> getGrain(String minionId, String grain) {
        return callSync(Grains.item(true, grain), minionId).flatMap(grains ->
           Optional.ofNullable(grains.get(grain))
        );
    }

    /**
     * Run a remote command on a given minion.
     *
     * @param target the target
     * @param cmd the command
     * @return the output of the command
     */
    public Map<String, Result<String>> runRemoteCommand(Target<?> target, String cmd) {
        try {
            Map<String, Result<String>> result = Cmd.run(cmd).callSync(
                    SALT_CLIENT, target,
                    SALT_USER, SALT_PASSWORD, AuthModule.AUTO);
            return result;
        }
        catch (SaltException e) {
            throw new RuntimeException(e);
        }
    }

    /**
     * Returns the currently running jobs on the target
     *
     * @param target the target
     * @return list of running jobs
     */
    public Map<String, Result<List<SaltUtil.RunningInfo>>> running(Target<?> target) {
        try {
            return SaltUtil.running().callSync(
                    SALT_CLIENT, target,
                    SALT_USER, SALT_PASSWORD, AuthModule.AUTO);
        }
        catch (SaltException e) {
            throw new RuntimeException(e);
        }
    }

    /**
     * Return the jobcache filtered by metadata
     *
     * @param metadata search metadata
     * @return list of running jobs
     */
    public Map<String, Jobs.ListJobsEntry> jobsByMetadata(Object metadata) {
        return callSync(Jobs.listJobs(metadata));
    }

    /**
     * Return the result for a jobId
     *
     * @param jid the job id
     * @return map from minion to result
     */
    public Jobs.Info listJob(String jid) {
        return callSync(Jobs.listJob(jid));
    }

    /**
     * Match the salt minions against a target glob.
     *
     * @param target the target glob
     * @return a map from minion name to boolean representing if they matched the target
     */
    public Map<String, Result<Boolean>> match(String target) {
        try {
            Map<String, Result<Boolean>> result = Match.glob(target).callSync(
                    SALT_CLIENT, new Glob(target),
                    SALT_USER, SALT_PASSWORD, AuthModule.AUTO);
            return result;
        }
        catch (SaltException e) {
            throw new RuntimeException(e);
        }
    }

    /**
     * Get the CPU info from a minion.
     * @param minionId the minion id
     * @return the CPU data as a map.
     */
    public Optional<Map<String, Object>> getCpuInfo(String minionId) {
        return callSync(Status.cpuinfo(), minionId);
    }

    /**
     * Get DMI records from a minion.
     * @param minionId the minion id
     * @param recordType the record type to get
     * @return the DMI data as a map. An empty
     * imutable map is returned if there is no data.
     */
    public Optional<Map<String, Object>> getDmiRecords(String minionId,
            Smbios.RecordType recordType) {
        return callSync(Smbios.records(recordType), minionId).map(col ->
                col.isEmpty() ? Collections.emptyMap() : col.get(0).getData()
        );
    }

    /**
     * Call 'saltutil.sync_beacons' to sync the beacons to the target minion(s).
     * @param target a target glob
     */
    public void syncBeacons(String target) {
        try {
            com.suse.manager.webui.utils.salt.SaltUtil.syncBeacons(
                    Optional.of(true), Optional.empty()).callSync(SALT_CLIENT,
                    new Glob(target), SALT_USER, SALT_PASSWORD, AuthModule.AUTO);
        }
        catch (SaltException e) {
            throw new RuntimeException(e);
        }
    }

    /**
     * Call 'saltutil.sync_grains' to sync the grains to the target minion(s).
     * @param target a target glob
     */
    public void syncGrains(String target) {
        try {
            SaltUtil.syncGrains(Optional.empty(), Optional.empty()).callSync(SALT_CLIENT,
                    new Glob(target), SALT_USER, SALT_PASSWORD, AuthModule.AUTO);
        }
        catch (SaltException e) {
            throw new RuntimeException(e);
        }
    }

    /**
     * Call 'saltutil.sync_modules' to sync the grains to the target minion(s).
     * @param target a target glob
     */
    public void syncModules(String target) {
        try {
            SaltUtil.syncModules(Optional.empty(), Optional.empty()).callSync(SALT_CLIENT,
                    new Glob(target), SALT_USER, SALT_PASSWORD, AuthModule.AUTO);
        }
        catch (SaltException e) {
            throw new RuntimeException(e);
        }
    }

    /**
     * Get the udev database from a minion.
     * @param minionId the minion id
     * @return the udev db as a list of maps, where each map is a db entry.
     */
    public Optional<List<Map<String, Object>>> getUdevdb(String minionId) {
        return callSync(Udevdb.exportdb(), minionId);
    }

    /**
     * Get the content of file from a minion.
     * @param minionId the minion id
     * @param path the path of the file
     * @return the content of a file as a string
     */
    public Optional<String> getFileContent(String minionId, String path) {
        return callSync(SumaUtil.cat(path), minionId);
    }

    /**
     * Get the output of the '/usr/bin/read_values' if available.
     * @param minionId the minion id
     * @return the output of command as a string.
     */
    public Optional<String> getMainframeSysinfoReadValues(String minionId) {
        return callSync(MainframeSysinfo.readValues(), minionId);
    }

    /**
     * Schedule a function call for a given target.
     *
     * @param name the name to use for the scheduled job
     * @param call the module call to schedule
     * @param target the target
     * @param scheduleDate schedule date
     * @param metadata metadata to pass to the salt job
     * @return the result of the schedule call
     * @throws SaltException in case there is an error scheduling the job
     */
    public Map<String, Result<Schedule.Result>> schedule(String name,
            LocalCall<?> call, Target<?> target, ZonedDateTime scheduleDate,
            Map<String, ?> metadata) throws SaltException {
        // We do one Salt call per timezone: group minions by their timezone offsets
        Map<String, Result<String>> minionOffsets = getTimezoneOffsets(target);
        Map<String, List<String>> offsetMap = minionOffsets.keySet().stream()
                .collect(Collectors.groupingBy(k -> minionOffsets.get(k).result().get()));
        if (LOG.isDebugEnabled()) {
            LOG.debug("Minions grouped by timezone offsets: " + offsetMap);
        }

        // The return type is a map of minion ids to their schedule results
        return offsetMap.entrySet().stream().flatMap(entry -> {
            LocalDateTime targetScheduleDate = scheduleDate.toOffsetDateTime()
                    .withOffsetSameInstant(ZoneOffset.of(entry.getKey())).toLocalDateTime();
            try {
                Target<?> timezoneTarget = new MinionList(entry.getValue());
                Map<String, Result<Schedule.Result>> result = Schedule
                        .add(name, call, targetScheduleDate, metadata)
                        .callSync(SALT_CLIENT, timezoneTarget,
                                SALT_USER, SALT_PASSWORD, AuthModule.AUTO);
                return result.entrySet().stream();
            }
            catch (SaltException e) {
                LOG.error(String.format("Error scheduling actions: %s", e.getMessage()));
                return Stream.empty();
            }
        }).collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue));
    }

    /**
     * Execute a LocalCall synchronously on the default Salt client.
     *
     * @param <T> the return type of the call
     * @param call the call to execute
     * @param target minions targeted by the call
     * @return the result of the call
     * @throws SaltException in case of an error executing the job with Salt
     */
    public <T> Map<String, Result<T>> callSync(LocalCall<T> call, Target<?> target)
            throws SaltException {
        return call.callSync(
                SALT_CLIENT, target, SALT_USER, SALT_PASSWORD, AuthModule.AUTO);
    }

    /**
     * Execute a LocalCall synchronously using salt-ssh.
     *
     * @param <T> the return type of the call
     * @param call the call to execute
     * @param target minions targeted by the call
     * @param rosterFile alternative roster file to use (default: /etc/salt/roster)
     * @param ignoreHostKeys use this option to disable 'StrictHostKeyChecking'
     * @param sudo run command via sudo (default: false)
     * @return result of the call
     */
    public <T> Map<String, Result<SSHResult<T>>> callSyncSSH(LocalCall<T> call,
            Target<?> target, boolean ignoreHostKeys, String rosterFile, boolean sudo) {
        try {
            SaltSSHConfig sshConfig = new SaltSSHConfig.Builder()
                    .ignoreHostKeys(ignoreHostKeys)
                    .rosterFile(rosterFile)
                    .sudo(sudo)
                    .build();

            return call.callSyncSSH(SALT_CLIENT, target, sshConfig);
        }
        catch (SaltException e) {
            throw new RuntimeException(e);
        }
    }

    /**
     * Execute a LocalCall asynchronously on the default Salt client.
     *
     * @param <T> the return type of the call
     * @param call the call to execute
     * @param target minions targeted by the call
     * @return the LocalAsyncResult of the call
     * @throws SaltException in case of an error executing the job with Salt
     */
    public <T> LocalAsyncResult<T> callAsync(LocalCall<T> call, Target<?> target)
            throws SaltException {
        return call.callAsync(
                SALT_CLIENT, target, SALT_USER, SALT_PASSWORD, AuthModule.AUTO);
    }

    /**
     * Remove a scheduled job from the minion
     *
     * @param name the name of the job to delete from the schedule
     * @param target the target
     * @return the result
     */
    public Map<String, Result<Schedule.Result>> deleteSchedule(
            String name, Target<?> target) {
        try {
            return Schedule.delete(name).callSync(
                    SALT_CLIENT, target,
                    SALT_USER, SALT_PASSWORD, AuthModule.AUTO);
        }
        catch (SaltException e) {
            throw new RuntimeException(e);
        }
    }

    /**
     * Remove a scheduled task (referenced via action id) on a list of servers.
     *
     * @param sids server ids
     * @param aid action id
     * @return the list of server ids that successfully removed the action
     */
    public List<Long> deleteSchedulesForActionId(List<Long> sids, long aid) {
        List<MinionServer> minions = MinionServerFactory
                .lookupByIds(sids)
                .collect(Collectors.toList());

        Map<String, Result<Schedule.Result>> results = deleteSchedule(
                "scheduled-action-" + aid,
                new MinionList(minions.stream()
                        .map(MinionServer::getMinionId)
                        .collect(Collectors.toList())
                )
        );
        return minions.stream().filter(minionServer -> {
            Schedule.Result result = results.get(minionServer.getMinionId()).result().get();
            return result != null && result.getResult();
        })
          .map(MinionServer::getId)
          .collect(Collectors.toList());
    }

    /**
     * Get the network interfaces from a minion.
     * @param minionId the minion id
     * @return a map containing information about each network interface
     */
    public Optional<Map<String, Network.Interface>> getNetworkInterfacesInfo(
            String minionId) {
        return callSync(Network.interfaces(), minionId);
    }

    /**
     * Get the IP routing that the minion uses to connect to the master.
     * @param minionId the minion id
     * @return a map of IPv4 and IPv6 (if available)
     * {@link com.suse.manager.webui.utils.salt.custom.SumaUtil.IPRoute}
     */
    public Optional<Map<SumaUtil.IPVersion, SumaUtil.IPRoute>> getPrimaryIps(
            String minionId) {
        return callSync(SumaUtil.primaryIps(), minionId);
    }

    /**
     * Get the kernel modules used for each network interface.
     * @param minionId the minion id
     * @return a map with the network interface name as key and
     * the kernel module name or null as a value
     */
    public Optional<Map<String, Optional<String>>> getNetModules(String minionId) {
        return callSync(SumaUtil.getNetModules(), minionId);
    }

    /**
     * Find all minions matching the target expression and
     * retain only those allowed for the given user.
     *
     * @param user the user
     * @param target the Salt target expression
     * @return a set of minion ids
     */
    public Set<String> getAllowedMinions(User user, String target) {
        Set<String> saltMatches = match(target).keySet();
        Set<String> allowed = new HashSet<>(saltMatches);

        List<String> minionIds = MinionServerFactory
                .lookupVisibleToUser(user)
                .map(MinionServer::getMinionId)
                .collect(Collectors.toList());

        allowed.retainAll(minionIds);

        return allowed;
    }

    /**
     * Save a Salt .sls file.
     * @param orgId the organization id
     * @param name the name of the file
     * @param content the content of the file
     * @param oldName the previous name of the file,
     *                when the file already exists
     * @param oldChecksum the checksum of the file at
     *                    the time of showing it to the user
     */
    public void saveCustomState(long orgId, String name, String content,
                                String oldName, String oldChecksum) {
        try {
            customSaltStorageManager.storeState(orgId, name, content, oldName, oldChecksum);
            if (customSaltStorageManager.isRename(oldName, name)) {
                // for some reason the following native query does not trigger a flush
                // and the new name is not yet in the db
                StateFactory.getSession().flush();

                SaltStateGeneratorService.INSTANCE.regenerateCustomStates(orgId, name);
            }
        }
        catch (IOException e) {
            throw new RuntimeException(e);
        }
    }

    /**
     * Delete a Salt .sls file.
     * @param orgId the organization id
     * @param name the name of the file
     */
    public void deleteCustomState(long orgId, String name) {
        try {
            StateFactory.CustomStateRevisionsUsage usage = StateFactory
                    .latestStateRevisionsByCustomState(orgId, name);
            customSaltStorageManager.deleteState(orgId, name);
            SaltStateGeneratorService.INSTANCE.regenerateCustomStates(usage);
        }
        catch (IOException e) {
            throw new RuntimeException(e);
        }
    }

    /**
     * Get a list of all Salt .sls files
     * for a given organization.
     *
     * @param orgId the organization id
     * @return a list of names without the .sls extension
     */
    public List<String> getCatalogStates(long orgId) {
        return customSaltStorageManager.listByOrg(orgId);
    }

    /**
     * Get the content of the give Salt .sls file.
     * @param orgId the organization id
     * @param name the name of the file
     * @return the content of the file if the file exists
     */
    public Optional<String> getOrgStateContent(long orgId, String name) {
        try {
            return customSaltStorageManager.getContent(orgId, name);
        }
        catch (IOException e) {
            throw new RuntimeException(e);
        }
    }

    /**
     * Returns true if an org state exists.
     * @param orgId the organization id
     * @param name the name of the file
     * @return true if the file exists
     */
    public boolean orgStateExists(long orgId, String name) {
        return customSaltStorageManager.exists(orgId, name);
    }

    /**
     * Add the organization namespace to the given states.
     * @param orgId the organization id
     * @param states the states names
     * @return a set of names that included the organization namespace
     */
    public Set<String> resolveOrgStates(long orgId, Set<String> states) {
        return states.stream().map(state -> customSaltStorageManager
                .getOrgNamespace(orgId) + "." + state)
                .collect(Collectors.toSet());
    }

    /**
     * Pings a target set of minions.
     * @param targetIn the target
     * @return a Map from minion ids which responded to the ping to Boolean.TRUE
     * @throws SaltException if we get a failure from Salt
     */
    public Map<String, Result<Boolean>> ping(Target<?> targetIn) throws SaltException {
        return callSync(
            Test.ping(),
            targetIn
        );
    }

    /**
     * Get the directory where custom state files are stored on disk.
     * @param orgId the organization id
     * @return the path where .sls files are stored
     */
    public String getCustomStateBaseDir(long orgId) {
        return customSaltStorageManager.getBaseDirPath();
    }

    /**
     * Gets a minion's master hostname.
     *
     * @param minionId the minion id
     * @return the master hostname
     */
    public Optional<String> getMasterHostname(String minionId) throws SaltException {
        return callSync(
            new LocalCall<>("config.get",
                    Optional.of(Arrays.asList("master")),
                    Optional.empty(),
                    new TypeToken<String>(){}
            ), minionId);
    }
}
