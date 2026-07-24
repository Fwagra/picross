// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import ColorHint from './ColorHint.vue';
import { withGlobal } from '../test-helpers/mountOptions.js';

// Monte ColorHint avec l'inject `colors` requis.
function mountColorHint(props) {
  return mount(ColorHint, {
    props,
    ...withGlobal({ provide: { colors: ['#ff0000', '#00ff00'] } }),
  });
}

describe('ColorHint', () => {
  it('affiche le nombre de l’indice', () => {
    const wrapper = mountColorHint({ hint: { number: 3, contiguous: false }, color: 0 });
    expect(wrapper.text()).toBe('3');
  });

  it('applique la couleur injectée au texte', () => {
    const wrapper = mountColorHint({ hint: { number: 2, contiguous: false }, color: 1 });
    expect(wrapper.attributes('style')).toContain('#00ff00');
  });

  it('marque la pastille contiguë seulement si number > 1', () => {
    const contigu = mountColorHint({ hint: { number: 4, contiguous: true }, color: 0 });
    expect(contigu.classes()).toContain('contiguous');

    const seul = mountColorHint({ hint: { number: 1, contiguous: true }, color: 0 });
    expect(seul.classes()).not.toContain('contiguous');
  });

  it('masque l’indice satisfait (correct)', () => {
    const wrapper = mountColorHint({ hint: { number: 2, contiguous: false, correct: true }, color: 0 });
    expect(wrapper.classes()).toContain('hidden');
  });
});
