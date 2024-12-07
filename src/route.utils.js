import expressListEndpoints from "express-list-endpoints";

export async function addNewRoute(appRouteDetails, RouteModelPromise) {
  try {
    const { RoutesModel } = await RouteModelPromise;
    const appRoute = new RoutesModel({
      ...appRouteDetails,
      created_timestamp: moment().tz("Asia/Kolkata").valueOf(),
    });
    await appRoute.save();
  } catch (error) {
    console.error(error);
    throw new Error(error?.message || error);
  }
}

export async function getRoute(routePath, GlobalConfig, RouteModelPromise) {
  try {
    const { APP_NAME, APP_NAMESPACE } = GlobalConfig;
    const { RoutesModel } = await RouteModelPromise;
    const appRoute = await RoutesModel.findOne({
      name: APP_NAME,
      namespace: APP_NAMESPACE,
      is_deleted: false,
      path: routePath,
    });
    return appRoute;
  } catch (error) {
    console.error(error);
    throw new Error(error?.message || error);
  }
}

export async function manageRoutes(
  routeStack,
  GlobalConfig,
  AccessGroupModelPromise,
  RouteModelPromise,
) {
  try {
    const { APP_NAME, APP_NAMESPACE, APP_PROTOCOL, APP_HOST, APP_PORT } =
      GlobalConfig;

    const { AccessGroupModel } = await AccessGroupModelPromise;

    const adminAccessGroup = await AccessGroupModel.findOne({
      is_administrator: true,
      is_deleted: false,
    });

    if (!adminAccessGroup) {
      throw new Error(`Admin access group error.`);
    }

    await Promise.all(
      routeStack.map(async (routeDetail) => {
        const routeDetails = {
          name: APP_NAME,
          namespace: APP_NAMESPACE,
          protocol: APP_PROTOCOL,
          host: APP_HOST,
          port: APP_PORT,
          is_exposed: true,
          is_secured: true,
          is_deleted: false,
          path: routeDetail.path,
          methods: routeDetail.methods,
          middlewares: routeDetail.middlewares,
          access_groups: [adminAccessGroup._id],
        };

        const route = await getRoute(
          routeDetail.path,
          GlobalConfig,
          RouteModelPromise,
        );

        if (route) {
          await route.updateOne({
            ...routeDetails,
            access_groups:
              route.access_groups?.length > 0
                ? route.access_groups
                : routeDetails.access_groups,
            is_exposed:
              typeof route?.is_exposed === "boolean"
                ? route.is_exposed
                : routeDetails.is_exposed,
            is_deleted:
              typeof route?.is_deleted === "boolean"
                ? route.is_deleted
                : routeDetails.is_deleted,
            is_secured:
              typeof route?.is_secured === "boolean"
                ? route.is_secured
                : routeDetails.is_secured,
            updated_timestamp: moment().tz("Asia/Kolkata").valueOf(),
          });
        } else {
          await addNewRoute(routeDetails, RouteModelPromise);
        }
      }),
    );
  } catch (error) {
    console.error(error);
    throw new Error(error?.message || error);
  }
}

export async function syncRouteDetails(dependencyValues = {}) {
  try {
    const { app, GlobalConfig, AccessGroupModelPromise, RouteModelPromise } =
      dependencyValues;

    const routeStack = expressListEndpoints(app);

    await manageRoutes(
      routeStack,
      GlobalConfig,
      AccessGroupModelPromise,
      RouteModelPromise,
    );

    console.log("Routes synchronized successfully.");
  } catch (error) {
    console.error(error);
    throw new Error(error?.message || error);
  }
}
