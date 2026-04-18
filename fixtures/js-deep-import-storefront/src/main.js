import { renderCart } from './features/cart/render-cart.js';
import { showInventoryTag } from './features/catalog/show-inventory-tag.js';
import { renderHero } from './features/home/render-hero.js';

export const storefrontPreview = [
  renderHero(),
  renderCart(),
  showInventoryTag('low-stock')
].join(' | ');
