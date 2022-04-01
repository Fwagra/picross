<template>
    <aside>

    <div class="toolbar">
        <!-- <div class="current-color" v-tippy="{ content: 'Couleur actuelle' }" :style="{backgroundColor: getCurrentColor}"></div> -->
        <color-tool v-for="(color, colorIndex) in colors" :key="colorIndex" :color="color" :colorIndex="colorIndex" :editMode="editMode" :current="colorIndex === currentColor"></color-tool>
        <div v-if="!editMode" :class="{current: isEraser}" class="eraser tool-btn" v-tippy="{ content: 'Gomme' }"  @click="updateCurrentColor('')">
            <i class="gg-erase"></i>
        </div>
    </div>
    <template v-if="!editMode">
        <div class="toolbar">
            <div @click="changeBackground" class="contrast tool-btn" v-tippy="{content: 'Changer la couleur de fond' }">
                <i class="gg-edit-contrast"></i>
            </div>
            <div class="tool-btn history" v-tippy="{content: 'Annuler la dernière action'}" @click="$emit('clickHistory')">
                <i class="gg-undo"></i>
            </div>
        </div>
        <div class="buttons">
            <div class="button transparent" @click="rules = true">
                Comment jouer ?
            </div>
            <Modal type="message" title="Comment jouer" v-if="rules" @close="rules = false">
                <ul>
                    <li>Le but du jeu est de remplir toutes les cases de la grille</li>
                    <li>A côté de chaque ligne et colonne se trouvent des indices sur les couleurs qui la composent</li>
                    <li>Par exemple, un <strong>4</strong> rouge sur une ligne indique qu'elle contient 4 cases rouges.</li>
                    <li>Si ce <strong>4</strong> est entouré, les cases rouges sont toutes adjacentes</li>
                    <li>S'il n'est pas entouré, elles ne sont pas toutes adjacentes</li>
                </ul>

                <h3>Raccourcis clavier</h3>
                <ul>
                    <li><span>1 à 5 </span> pour choisir la couleur</li>
                    <li><span>E </span> pour la gomme</li>
                    <li><span>Z </span> pour annuler la dernière action</li>
                    <li><span>C </span> pour changer la couleur de fond</li>
                </ul>
            </Modal>
            <a :href="url" class="button transparent">
                Créer ma grille
            </a>
            <div v-if="victory" @click="$emit('switchMode')" class="button transparent">
                Éditer la grille
            </div>
        </div>
    </template>
    <template v-if="editMode">
        <div class="toolbar">
            <div @click="changeBackground" class="contrast tool-btn" v-tippy="{content: 'Changer la couleur de fond' }">
                <i class="gg-edit-contrast"></i>
            </div>
            <div class="eraser tool-btn" :class="{current: isEraser}" v-tippy="{ content: 'Gomme' }"  @click="updateCurrentColor('')">
                <i class="gg-erase"></i>
            </div>
            <div class="fill-color tool-btn" v-tippy="{ content: 'Remplir les cases vides avec la couleur sélectionnée' }" @click="$emit('fillColor')"><i class="gg-color-bucket"></i></div>
            <div v-tippy="{ content: 'Ajouter une couleur' }" class="add-color tool-btn" @click="$emit('addColor')" v-if="colors.length < 5">
                <i class="gg-add"></i>
            </div>
            <div  class="delete-color tool-btn" v-tippy="{ content: 'Retirer une couleur' }" @click="$emit('removeColor')" v-if="colors.length > 2"><i class="gg-remove"></i></div>
            
        </div>
    </template>
    <template v-if="editMode">
        <div class="settings">
            <div class="field">
                <label for="cols">Colonnes</label>
                <input type="number" id="cols" min="3" max="15" :value="gridColumns" @change="$emit('updateCols', $event.target.value)">
            </div>
            <div class="field">
                <label for="lines">Lignes</label>
                <input type="number" id="lines" min="3" max="15" :value="gridRows" @change="$emit('updateRows', $event.target.value)">
            </div>
        </div>
        <div class="share-part">
            <div  @[isFilled&&`click`]="openShareModal" :class='{disabled: !isFilled }' v-tippy="{ content: shareMessage }" class="share button"><i class="gg-link"></i> <span>Partager mon Picross</span></div>
            <Modal title="Copie le lien ci-dessous et défie tes amis !"  @close="share = !share" :shareLink="shareLink" :type="'link'" v-if="share">
            </Modal>
        </div>
    </template>
    </aside>
</template>
<script>

import ColorTool from './ColorTool.vue';
import Modal from './Modal.vue';

export default {
    components: {
        ColorTool,
        Modal
    },
    emits: ['addColor', 'removeColor', 'updateRows', 'updateCols', 'fillColor', 'updateShareLink', 'switchMode', 'clickHistory'],
    inject: [ 'updateCurrentColor'],
    props: ['colors', 'currentColor', 'gridRows', 'gridColumns', "isFilled", "shareLink", "editMode", "victory"],
    computed: {
        getCurrentColor() {
            return this.currentColor === '' ? '#FFF' : this.colors[this.currentColor];
        },
        shareMessage() {
            return !this.isFilled ? 'Ce bouton sera disponible quand toute la grille sera remplie' : '';
        },
        isEraser() {
            return this.currentColor === '';
        },
        url() {
            return window.location.origin;
        }
    },
    created: function() {
       window.addEventListener('keydown', this.handleKeydowns);
    },
    beforeUnmount() {
        window.removeEventListener('keydown', this.handleKeydowns);
    },
    data() {
        return {
            share: false,
            rules: false,
            backgrounds: [
                '#e9e9e9',
                '#848282',
                '#1f1f1f',
            ],
            currentBackground: 0,
        }
    },
    methods: {
        openShareModal() {
            this.$emit('updateShareLink');
            this.share = true;
        },
        changeBackground() {
            this.currentBackground = (this.currentBackground + 1) % this.backgrounds.length;
            const root = document.documentElement;

            root.style.setProperty('--background', this.backgrounds[this.currentBackground]);
        },
        // Keyboard shortcuts
        handleKeydowns(e) {
            if (e.keyCode === 49) {
                this.updateCurrentColor(0);
            } else if (e.keyCode === 50) {
                this.updateCurrentColor(1);
            } else if (e.keyCode === 51) {
                this.updateCurrentColor(2);
            } else if (e.keyCode === 52) {
                this.updateCurrentColor(3);
            } else if (e.keyCode === 53) {
                this.updateCurrentColor(4);
            } else if (e.keyCode === 67) {
                this.changeBackground();
            } else if (e.keyCode === 69) {
                this.updateCurrentColor('');
            } else if (e.keyCode === 90) {
                this.$emit('clickHistory');
            }
        },
    }
}
</script>


<style scoped>

.current-color {
    width: 4rem;
    display: inline-block;
    height: 4rem;
    border-radius: 3px;
    margin: 0.5rem;
}
.tool-btn {
    border-radius: 50%;
    cursor: pointer;
    color: var(--grid-dark);
    width: 3rem;
    height: 3rem;
    display: flex;
    justify-content: center;
    align-items: center;
    background: var(--background);
}
[class*='gg-']{
    --ggs: .9rem;
}
.tool-btn:hover {
    background-color: var(--grid-separations);
    color: #FFF;
    transition: all .3s ease;
}

.toolbar {
    display: flex;
    padding: 1rem 0;
    justify-content: center;
    user-select: none;
}
.toolbar:first-of-type {
    padding-top: 2rem;
}
.toolbar > * {
    margin-right: 0.5rem;
}

.message li {
    line-height: 1;
}
label {
    display: block;
    font-size: 2rem;
}
.settings {
    display: flex;
    align-items: center;
    margin-top: 1rem;
}
.field {
    width: 50%;
}
.field:not(:last-of-type) {
    padding-right: 1rem;
}
.share {
    padding: .5rem 1.5rem .5rem 2rem;
    margin-top: 2rem;
}
.share span {
    margin-left: 1rem;
}

.eraser {
    position: relative;
}
.eraser::before {
    content: '●';
    position: absolute;
    left: 0;
    text-align: center;
    right: 0;
    transition: all 1s;
    transform: translateY(1rem);
    z-index: -1;

}
.current {
        box-shadow: inset 0 0 0 2px var(--grid-dark);
    transition: box-shadow 0.2s ease;
}
.eraser.current::before {
    transform: translateY(-2rem);
}
@media screen and (min-width: 600px) {
    .toolbar:first-of-type {
        padding-top: 5rem;
    }
    .toolbar {
        justify-content: flex-start;

    }
}
</style>