export default {
  'clusters/list': () => import('./list-clusters/list-clusters.renderer.js'),
  'clusters/cluster': () => import('./cluster/cluster.renderer.js'),
  'clusters/import': () => import('./import-cluster/import-cluster.renderer.js')
}