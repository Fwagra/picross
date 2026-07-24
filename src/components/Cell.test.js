// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import { ref } from 'vue';
import { mount } from '@vue/test-utils';
import Cell from './Cell.vue';
import { withGlobal } from '../test-helpers/mountOptions.js';

function mountCell(props, currentColor = 0) {
  return mount(Cell, {
    props: {
      color: '',
      rowIndex: 0,
      columnIndex: 0,
      totalRows: 5,
      totalColumns: 5,
      pressed: false,
      ...props,
    },
    ...withGlobal({ provide: { colors: ref(['#ff0000', '#00ff00']), currentColor: ref(currentColor) } }),
  });
}

describe('Cell', () => {
  it('applique la couleur injectée en fond', () => {
    const wrapper = mountCell({ color: 1 });
    expect(wrapper.attributes('style')).toContain('#00ff00');
  });

  it('émet « hover » avec ses coordonnées au survol', async () => {
    const wrapper = mountCell({ rowIndex: 2, columnIndex: 3 });
    await wrapper.trigger('mouseover');
    expect(wrapper.emitted('hover')).toBeTruthy();
    expect(wrapper.emitted('hover')[0]).toEqual([2, 3]);
  });

  it('ne trace pas au survol si le bouton n’est pas pressé', async () => {
    const wrapper = mountCell({ pressed: false, color: '' });
    await wrapper.trigger('mouseover');
    expect(wrapper.emitted('update-cell')).toBeFalsy();
  });

  it('trace au survol si pressé sur une case vide', async () => {
    const wrapper = mountCell({ pressed: true, color: '', rowIndex: 1, columnIndex: 1 });
    await wrapper.trigger('mouseover');
    expect(wrapper.emitted('update-cell')).toBeTruthy();
    expect(wrapper.emitted('update-cell')[0]).toEqual([1, 1]);
  });

  it('marque les séparations fortes tous les 5 (col5/row5)', () => {
    const wrapper = mountCell({ columnIndex: 4, rowIndex: 4, totalColumns: 10, totalRows: 10 });
    expect(wrapper.classes()).toContain('col5');
    expect(wrapper.classes()).toContain('row5');
  });

  it('n’applique pas col5 sur la dernière colonne', () => {
    const wrapper = mountCell({ columnIndex: 4, totalColumns: 5 });
    expect(wrapper.classes()).not.toContain('col5');
  });
});
