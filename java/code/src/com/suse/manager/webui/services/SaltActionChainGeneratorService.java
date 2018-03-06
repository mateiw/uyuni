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
package com.suse.manager.webui.services;

import static com.suse.manager.webui.services.SaltConstants.SUMA_STATE_FILES_ROOT_PATH;
import static java.util.Collections.singletonList;
import static java.util.Collections.singletonMap;

import com.redhat.rhn.domain.action.Action;
import com.redhat.rhn.domain.action.ActionFactory;
import com.redhat.rhn.domain.action.ActionChain;
import com.redhat.rhn.domain.action.salt.ApplyStatesAction;
import com.redhat.rhn.domain.action.script.ScriptActionDetails;
import com.redhat.rhn.domain.server.Server;
import com.redhat.rhn.domain.server.MinionServerFactory;

import com.suse.manager.webui.utils.SaltActionChainState;

import org.apache.commons.io.FileUtils;
import org.apache.log4j.Logger;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;


/**
 * Service to manage the Salt Action Chains generated by Suse Manager.
 */
public enum SaltActionChainGeneratorService {

    // Singleton instance of this class
    INSTANCE;

    private static final String ACTIONCHAIN_SLS_FILE_PREFIX = "actionchain_";
    private static final String ACTIONCHAIN_SLS_FOLDER = "actionchains";

    /** Logger */
    private static final Logger LOG = Logger.getLogger(SaltActionChainGeneratorService.class);
    private static final String SCRIPTS_DIR = "scripts";

    private Path suseManagerStatesFilesRoot;

    SaltActionChainGeneratorService() {
        suseManagerStatesFilesRoot = Paths.get(SUMA_STATE_FILES_ROOT_PATH);
    }

    /**
     * Generate all SLS files for execution an Action Chain.
     * @param actionChain the action chain to execute
     * @param minionActions map containing the actions to execute per minion server
     * @return true if files are successfully generated
     */
    public boolean createActionChainSLSFiles(ActionChain actionChain, Map<Server, List<Action>> minionActions) {
        Map<String, Object> output = new LinkedHashMap<>();
        String prevStateId = null;
        String prevSaltMod = null;
        for (Map.Entry<Server, List<Action>> entry : minionActions.entrySet()) {
            int chunk = 1;
            for (Action action : entry.getValue()) {
                String stateId = "suma_actionchain_" + actionChain.getId() + "_chunk_" + chunk + "_action_" + action.getId();
                if (ActionFactory.TYPE_REBOOT.equals(action.getActionType())) {
                    String rebootStateId = "suma_reboot_action_" + action.getId();
                    output.putAll(renderRebootAction(rebootStateId, prevSaltMod, prevStateId, action));
                    output.putAll(addNextChunkStateExecution(rebootStateId + "_schedule_next_chunk", "cmd",
                            rebootStateId, actionChain, chunk + 1));
                    saveChunkSLS(output, entry.getKey().getMachineId(), actionChain.getId(), chunk);
                    output.clear();
                    prevSaltMod = null;
                    prevStateId = null;
                    chunk = chunk + 1;
                    continue;
                }
                else if (ActionFactory.TYPE_SCRIPT_RUN.equals(action.getActionType())) {
                    output.putAll(renderRemoteExecutionAction(stateId, prevSaltMod, prevStateId, action));
                }
                else if (ActionFactory.TYPE_APPLY_STATES.equals(action.getActionType())) {
                    output.putAll(renderApplyStatesAction(stateId, prevSaltMod, prevStateId, action));
                }
                prevSaltMod = ((Map<String, Object>) output.get(stateId)).entrySet()
                        .iterator().next().getKey().split("\\.")[0];
                prevStateId = stateId;
            }
            saveChunkSLS(output, entry.getKey().getMachineId(), actionChain.getId(), chunk);
        }
        return true;
    }

    public void removeActionChainSLSFiles(Long actionChainId, String minionId, Integer chunk,
        Boolean actionChainFailed) {
        MinionServerFactory.findByMinionId(minionId).ifPresent(minionServer -> {
            Path targetDir = Paths.get(suseManagerStatesFilesRoot.toString(), ACTIONCHAIN_SLS_FOLDER);
            Path targetFilePath = Paths.get(targetDir.toString(), getActionChainSLSFileName(actionChainId,
                    minionServer.getMachineId(), chunk));
            // Add specified SLS chunk file to remove list
            List<Path> filesToDelete = new ArrayList<>();
            filesToDelete.add(targetFilePath);
            // Add possible script files to remove list
            Path scriptsDir = Paths.get(targetDir.toString(), SCRIPTS_DIR);
            String filePattern = ACTIONCHAIN_SLS_FILE_PREFIX + actionChainId +
                    "_" + minionServer.getMachineId() + "_";
            String scriptPattern = "script_suma_actionchain_" + actionChainId +
                    "_chunk_" + chunk;
            try {
                for (Path path : Files.list(scriptsDir)
                        .filter(path -> path.toString().startsWith(
                                Paths.get(scriptsDir.toString(), scriptPattern).toString()))
                        .collect(Collectors.toList())) {
                    filesToDelete.add(path);
                }
                // Add also next SLS chunks because the Action Chain failed and these
                // files are not longer needed.
                if (actionChainFailed) {
                    filesToDelete.addAll(Files.list(targetDir)
                            .filter(path -> path.toString().startsWith(
                                    Paths.get(scriptsDir.toString(), filePattern).toString()))
                            .collect(Collectors.toList()));
                    filesToDelete.addAll(Files.list(scriptsDir)
                            .filter(path -> path.toString().startsWith(
                                    Paths.get(scriptsDir.toString(), scriptPattern).toString()))
                            .collect(Collectors.toList()));
                }
                // Remove the files
                for (Path path : filesToDelete) {
                    Files.deleteIfExists(path);
                }
            }
            catch (IOException e) {
                LOG.error(e.getMessage(), e);
            }
        });
    }

    private String getActionChainSLSFileName(Long actionChainId, String machineId, Integer chunk) {
        return (ACTIONCHAIN_SLS_FILE_PREFIX + Long.toString(actionChainId) +
                "_" + machineId + "_" + Integer.toString(chunk) + ".sls");
    }

    private Map<String, Object> addNextChunkStateExecution(String stateId, String prevSaltMod,
            String prevStateId, ActionChain actionChain, Integer chunk) {
        Map<String, Object> entry = new LinkedHashMap<>();
        entry.put("name", "mgractionchains.next");
        entry.put("actionchain_id", actionChain.getId());
        entry.put("chunk", chunk);
        if (prevStateId != null) {
            List<Map<String, String>> requireEntryList = new ArrayList<Map<String, String>>();
            Map<String, String> requireEntry = new HashMap<>();
            requireEntry.put(prevSaltMod, prevStateId);
            requireEntryList.add(requireEntry);
            entry.put("require", requireEntryList);
        }
        Map<String, Object> stateList = new HashMap<>();
        List<Map<String, Object>> paramList = new ArrayList<Map<String, Object>>();
        for (Map.Entry<String, Object> ent : entry.entrySet()) {
            Map<String, Object> tempEntry = new HashMap<>();
            tempEntry.put(ent.getKey(), ent.getValue());
            paramList.add(tempEntry);
        }
        stateList.put("module.run", paramList);
        Map<String, Object> ret = new HashMap<>();
        ret.put(stateId, stateList);
        return ret;
    }

    private void saveChunkSLS(Map<String, Object> output, String machineId, Long actionChainId, Integer chunk) {
        Path targetDir = Paths.get(suseManagerStatesFilesRoot.toString(), ACTIONCHAIN_SLS_FOLDER);
        try {
            Files.createDirectories(targetDir);
            Path targetFilePath = Paths.get(targetDir.toString(),
                    getActionChainSLSFileName(actionChainId, machineId, chunk));
            com.suse.manager.webui.utils.SaltStateGenerator saltStateGenerator =
                    new com.suse.manager.webui.utils.SaltStateGenerator(targetFilePath.toFile());
            saltStateGenerator.generate(new SaltActionChainState(output));
        }
        catch (IOException e) {
            LOG.error(e.getMessage(), e);
        }
    }

    private Map<String, ?> renderRemoteExecutionAction(String stateId, String prevSaltMod,
            String prevStateId, Action action) {
        ScriptActionDetails scriptAction = ActionFactory.lookupScriptActionDetails(action);
        String script = scriptAction.getScriptContents();

        Path scriptsDir = Paths.get(suseManagerStatesFilesRoot.toString(),
                ACTIONCHAIN_SLS_FOLDER, SCRIPTS_DIR);
        String scriptFile = "script_" + stateId + ".sh";

        try {
            FileUtils.forceMkdir(scriptsDir.toFile()); // TODO set permissions?
            FileUtils.writeStringToFile(scriptsDir.resolve(scriptFile).toFile(),
                    script.replaceAll("\r\n", "\n"));
        }
        catch (IOException e) {
            LOG.error("Could not write script to file " + scriptFile, e);
            throw new RuntimeException(e); // TODO to throw or not to throw ?
        }

        Map<String, String> pillar = new HashMap<>();
        pillar.put("mgr_remote_cmd_script",
                "salt://" + ACTIONCHAIN_SLS_FOLDER + "/" + SCRIPTS_DIR + "/" + scriptFile);
        pillar.put("mgr_remote_cmd_runas", scriptAction.getUsername());
        return renderStateApply(stateId, prevSaltMod, prevStateId,
                singletonList("remotecommands"), Optional.of(pillar));
    }

    private Map<String, ?> renderApplyStatesAction(String stateId, String prevSaltMod, String prevStateId,
                                                   Action action) {
        List<String> mods = ((ApplyStatesAction)action).getDetails().getMods();

        return renderStateApply(stateId, prevSaltMod, prevStateId, mods, Optional.empty());
    }

    private Map<String, ?> renderStateApply(String stateId, String prevSaltMod, String prevStateId, List<String> mods,
                                            Optional<Map<String, ?>> pillar) {
        List<Map<String, Object>> params = new ArrayList<>();
        params.add(singletonMap("name", "state.apply"));
        if (!mods.isEmpty()) {
            params.add(singletonMap("mods",
                    mods.stream().collect(Collectors.joining(","))));
        }

        pillar.ifPresent(p ->
                params.add(singletonMap("kwargs", singletonMap("pillar", p)))
        );

        if (prevStateId != null) {
            params.add(singletonMap("require",
                    singletonList(singletonMap(prevSaltMod, prevStateId))));
        }

        return singletonMap(stateId, singletonMap("module.run", params));
    }

    private Map<String, Object> renderRebootAction(String stateId, String prevSaltMod,
            String prevStateId, Action action) {
        Map<String, Object> entry = new LinkedHashMap<>();
        entry.put("name", "shutdown -r +1");
        if (prevStateId != null) {
            List<Map<String, String>> requireEntryList = new ArrayList<Map<String, String>>();
            Map<String, String> requireEntry = new HashMap<>();
            requireEntry.put(prevSaltMod, prevStateId);
            requireEntryList.add(requireEntry);
            entry.put("require", requireEntryList);
        }
        Map<String, Object> stateList = new HashMap<>();
        List<Map<String, Object>> paramList = new ArrayList<Map<String, Object>>();
        for (Map.Entry<String, Object> ent : entry.entrySet()) {
            Map<String, Object> tempEntry = new HashMap<>();
            tempEntry.put(ent.getKey(), ent.getValue());
            paramList.add(tempEntry);
        }
        stateList.put("cmd.run", paramList);
        Map<String, Object> ret = new HashMap<>();
        ret.put(stateId, stateList);
        return ret;
    }
}
