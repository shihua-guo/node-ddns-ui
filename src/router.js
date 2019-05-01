import 'regenerator-runtime/runtime';
const routes = {
  '/foo': () => import('./views/foo'),
  '/bar': () => import('./views/bar')
};
/**
 * webpack 可以使用异步加载模块。这里使用async 和 await 实现
 */
class Router {
  start() {
    window.addEventListener('popstate', () => {
      this.load(location.pathname);
    });
    this.load(location.pathname);
  }
  go(path) {
    history.pushState({}, '', path);
    this.load(path);
  }
  async load(path) {
    if (path === '/')path = '/foo';
    const View = (await routes[path]()).default;
    const view = new View();
    view.mount(document.body);
  }
}
export default new Router();