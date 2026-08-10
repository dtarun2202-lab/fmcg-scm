import { prisma } from "../../config/db";
import { Graph } from "../../utils/graph";

/** Builds the routing graph fresh from DistributionRoute rows. Cache this in memory and rebuild on route/warehouse changes rather than per-request in production. */
export async function buildDistributionGraph(): Promise<Graph> {
  const routes = await prisma.distributionRoute.findMany();
  const graph = new Graph();

  for (const route of routes) {
    graph.addEdge(route.warehouseId, route.retailerId, route.distanceKm);
  }

  return graph;
}

export async function findBestRoute(warehouseId: string, retailerId: string) {
  const graph = await buildDistributionGraph();
  return graph.shortestPath(warehouseId, retailerId);
}

/** Plans a single-truck multi-stop delivery run using the nearest-neighbor heuristic. */
export async function planDeliveryRun(depotWarehouseId: string, retailerIds: string[]) {
  const graph = await buildDistributionGraph();
  const route = graph.nearestNeighborRoute(depotWarehouseId, retailerIds);
  return { route, stops: route.length - 1 };
}
