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

package com.suse.manager.webui.controllers.clusters;

import com.google.gson.Gson;
import com.google.gson.JsonParseException;
import com.google.gson.reflect.TypeToken;
import com.redhat.rhn.domain.formula.FormulaFactory;
import com.redhat.rhn.domain.server.MinionServer;
import com.redhat.rhn.domain.server.Server;
import com.redhat.rhn.domain.server.ServerFactory;
import com.redhat.rhn.domain.user.User;
import com.redhat.rhn.manager.entitlement.EntitlementManager;
import com.suse.manager.clusters.ClusterManager;
import com.suse.manager.clusters.ClusterNode;
import com.suse.manager.model.clusters.Cluster;
import com.suse.manager.webui.controllers.MinionController;
import com.suse.manager.webui.controllers.clusters.mappers.ResponseMappers;
import com.suse.manager.webui.controllers.clusters.response.ClusterResponse;
import com.suse.manager.webui.controllers.clusters.response.ClusterTypeResponse;
import com.suse.manager.webui.controllers.clusters.response.ServerResponse;
import com.suse.manager.webui.controllers.contentmanagement.handlers.ControllerApiUtils;
import com.suse.manager.webui.utils.FlashScopeHelper;
import com.suse.manager.webui.utils.gson.ResultJson;
import org.apache.http.HttpStatus;
import org.apache.log4j.Logger;
import spark.ModelAndView;
import spark.Request;
import spark.Response;
import spark.template.jade.JadeTemplateEngine;

import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import static com.suse.manager.webui.utils.SparkApplicationHelper.json;
import static com.suse.manager.webui.utils.SparkApplicationHelper.withCsrfToken;
import static com.suse.manager.webui.utils.SparkApplicationHelper.withOrgAdmin;
import static com.suse.manager.webui.utils.SparkApplicationHelper.withRolesTemplate;
import static com.suse.manager.webui.utils.SparkApplicationHelper.withUser;
import static com.suse.manager.webui.utils.SparkApplicationHelper.withUserPreferences;
import static spark.Spark.get;
import static spark.Spark.halt;
import static spark.Spark.post;

public class ClustersController {

    private static final Logger LOG = Logger.getLogger(ClustersController.class);

    private static Logger log = Logger.getLogger(ClustersController.class);
    private static final Gson GSON = ControllerApiUtils.GSON;
    private static ClusterManager clusterManager = ClusterManager.instance();

    public static void initRoutes(JadeTemplateEngine jade) {
        get("/manager/clusters",
                withCsrfToken(withUserPreferences(withRolesTemplate(ClustersController::showList))), jade);
        get("/manager/clusters/import",
                withCsrfToken(withUserPreferences(withRolesTemplate(ClustersController::showImport))), jade);
        get("/manager/cluster/:id",
                withCsrfToken(withUserPreferences(withRolesTemplate(ClustersController::showCluster))), jade);
        get("/manager/cluster/:id/join",
                withCsrfToken(withUserPreferences(withRolesTemplate(ClustersController::showJoinCluster))), jade);
        get("/manager/api/cluster/:id/nodes",
                withUser(ClustersController::listNodes));
        get("/manager/api/cluster/:id/nodes-to-join",
                withUser(ClustersController::listNodesToJoin));
        get("/manager/api/cluster/provider/:provider/formula/:type",
                withUser(ClustersController::providerFormulaData));
        get("/manager/api/cluster/provider/:provider/nodes",
                withUser(ClustersController::providerNodes));
        post("/manager/api/cluster/import",
                withOrgAdmin(ClustersController::importCluster));
        post("/manager/api/cluster/:id/join",
                withOrgAdmin(ClustersController::joinCluster));
    }

    private static ModelAndView showJoinCluster(Request request, Response response, User user) {
        Long id = getId(request);

        Cluster cluster = clusterManager.getCluster(id);
        Map<String, Object> data = new HashMap<>();
        data.put("flashMessage", FlashScopeHelper.flash(request));
        data.put("contentCluster", GSON.toJson(ResponseMappers.toClusterResponse(cluster)));
        MinionController.addActionChains(user, data);
        return new ModelAndView(data, "controllers/clusters/templates/join.jade");
    }

    private static String importCluster(Request request, Response response, User user) {
        Optional<Map<String, Object>> json = parseJson(request, response);
        if (json.isEmpty()) {
            return json(response, HttpStatus.SC_BAD_REQUEST,
                    ResultJson.error("request_error"));
        }
        // TODO schedule action
        return json(response, ResultJson.success("123")); // TODO return action id
    }

    private static Object joinCluster(Request request, Response response, User user) {
        Long id = getId(request);
        Optional<Map<String, Object>> json = parseJson(request, response);
        if (json.isEmpty()) {
            return json(response, HttpStatus.SC_BAD_REQUEST,
                    ResultJson.error("request_error"));
        }
        // TODO schedule action
        return json(response, ResultJson.success("123")); // TODO return action id
    }

    private static Optional<Map<String, Object>> parseJson(Request request, Response response) {
        Map<String, Object> jsonRequest;
        try {
            jsonRequest = GSON.fromJson(request.body(), new TypeToken<Map<String, Object>>() {
            }.getType());
        } catch (JsonParseException e) {
            LOG.error("Error parsing JSON body", e);
            return Optional.empty();
        }
        return Optional.of(jsonRequest);
    }

    private static String providerNodes(Request request, Response response, User user) {
        String providerType = request.params("provider");
        // TODO entitlement for provider
        List<Server> providerNodes = ServerFactory.findByEntitlement(EntitlementManager.SALT); // TODO change to clustering provider entitlement
        List<ServerResponse> data = providerNodes.stream()
                .filter(srv -> srv.asMinionServer().isPresent())
                .map(srv -> srv.asMinionServer().get())
                .map(ResponseMappers::toServerResponse)
                .collect(Collectors.toList());
        return json(response, ResultJson.success(data));
    }

    private static ModelAndView showImport(Request request, Response response, User user) {
        Map<String, Object> data = new HashMap<>();
        List<ClusterTypeResponse> types =
                clusterManager.findAllClusterTypes().stream().map(ResponseMappers::toClusterTypeResponse)
                        .collect(Collectors.toList());
        data.put("flashMessage", FlashScopeHelper.flash(request));
        data.put("contentImport", GSON.toJson(types));
        MinionController.addActionChains(user, data);
        return new ModelAndView(data, "controllers/clusters/templates/import.jade");
    }

    private static Object listNodes(Request request, Response response, User user) {
        Long id = getId(request);

        List<ClusterNode> data = ClusterManager.instance().getNodes(id);
        return json(response, ResultJson.success(data));
    }

    private static Object listNodesToJoin(Request request, Response response, User user) {
        Long id = getId(request);

        List<MinionServer> servers = ClusterManager.instance().getNodesAvailableForJoining(id);
        List<ServerResponse> data = servers.stream()
                .map(minion -> ResponseMappers.toServerResponse(minion))
                .collect(Collectors.toList());
        return json(response, ResultJson.success(data));
    }

    public static ModelAndView showList(Request request, Response response, User user) {
        Map<String, Object> data = new HashMap<>();
        List<ClusterResponse> clusters =
                clusterManager.findAllClusters(user.getOrg().getId()).stream().map(ResponseMappers::toClusterResponse)
                        .collect(Collectors.toList());
        data.put("flashMessage", FlashScopeHelper.flash(request));
        data.put("contentClusters", GSON.toJson(clusters));
        return new ModelAndView(data, "controllers/clusters/templates/list.jade");
    }

    public static ModelAndView showCluster(Request request, Response response, User user) {
        Long id = getId(request);

        Cluster cluster = clusterManager.getCluster(id);
        Map<String, Object> data = new HashMap<>();
        data.put("flashMessage", FlashScopeHelper.flash(request));
        data.put("contentCluster", GSON.toJson(ResponseMappers.toClusterResponse(cluster)));
        return new ModelAndView(data, "controllers/clusters/templates/cluster.jade");
    }

    public static String providerFormulaData(Request request, Response response, User user) {
        String providerType = request.params("provider");
        String formulaType = request.params("type");

        // TODO assert parameters not empty and valid
        // TODO sanitize type

        try {
            Thread.sleep(2000);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }

        Map<String, Object> data = new HashMap<>();
        data.put("layout",
                FormulaFactory.getClusterProviderFormulaLayout(providerType, formulaType)
                        .orElseGet(Collections::emptyMap));

        return json(response, ResultJson.success(data));
    }

    private static Long getId(Request request) {
        String idStr = request.params("id");
        Long id = null;
        try {
            id = Long.parseLong(idStr);
        }
        catch (Exception e) {
            log.error("Id '" + idStr + "' is not a number.");
            halt(HttpStatus.SC_BAD_REQUEST, "id is not a number");
        }
        return id;
    }

}