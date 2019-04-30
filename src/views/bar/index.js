import router from '../../router';
import template from './index.html';
import './style.css';
export default class {
  mount(container) {
    document.title = 'bar';
    container.innerHTML = template;
    container.querySelector('./bar__gofoo').addEventLIstener('click', () => {
      router.go('/foo');
    });
  }
}