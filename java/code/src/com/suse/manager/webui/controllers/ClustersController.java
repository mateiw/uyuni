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

package com.suse.manager.webui.controllers;

import com.google.gson.Gson;
import com.redhat.rhn.domain.user.User;
import com.suse.manager.webui.controllers.contentmanagement.handlers.ControllerApiUtils;
import com.suse.manager.webui.utils.FlashScopeHelper;
import com.suse.manager.webui.utils.gson.ResultJson;
import org.apache.log4j.Logger;
import spark.ModelAndView;
import spark.Request;
import spark.Response;
import spark.template.jade.JadeTemplateEngine;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static com.suse.manager.webui.utils.SparkApplicationHelper.json;
import static com.suse.manager.webui.utils.SparkApplicationHelper.withCsrfToken;
import static com.suse.manager.webui.utils.SparkApplicationHelper.withRolesTemplate;
import static com.suse.manager.webui.utils.SparkApplicationHelper.withUser;
import static com.suse.manager.webui.utils.SparkApplicationHelper.withUserPreferences;
import static spark.Spark.get;

public class ClustersController {

    private static Logger log = Logger.getLogger(ClustersController.class);
    private static final Gson GSON = ControllerApiUtils.GSON;

    public static void initRoutes(JadeTemplateEngine jade) {
        get("/manager/clusters",
                withCsrfToken(withUserPreferences(withRolesTemplate(ClustersController::show))), jade);
        get("/manager/api/clusters",
                withUser(ClustersController::list));
    }

    private static Object list(Request request, Response response, User user) {
        List data = dummyData();
        return json(response, ResultJson.success(data));
    }

    public static ModelAndView show(Request request, Response response, User user) {
        Map<String,Object> data = new HashMap<>();
        List clusters = dummyData();
        data.put("flashMessage", FlashScopeHelper.flash(request));
        data.put("contentClusters", GSON.toJson(clusters));
        return new ModelAndView(data, "templates/clusters/show.jade");
    }

    // TODO dummy data
    private static List dummyData() {
        List data = new ArrayList();
        {
            Map<String, Object> c1 = new HashMap<>();
            c1.put("id", 1);
            c1.put("name", "Cluster 1");
            data.add(c1);
        }
        {
            Map<String, Object> c1 = new HashMap<>();
            c1.put("id", 2);
            c1.put("name", "Cluster 2");
            data.add(c1);
        }
        return data;
    }
}
