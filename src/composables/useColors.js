import { ref } from 'vue';

// Gère la palette de couleurs et la couleur active (le pinceau).
// Composable autonome : aucune dépendance vers les autres domaines.
export function useColors() {
    const colors = ref([]);
    // Index de la couleur active, ou '' pour la gomme.
    const currentColor = ref(0);

    // Génère une couleur hexadécimale aléatoire sur 6 chiffres.
    function getRandomColor() {
        let color = '';
        while (color.length < 6) {
            color = Math.floor(Math.random() * 16777215).toString(16);
        }
        return '#' + color;
    }

    function updateColors(colorIndex, newColor) {
        colors.value[colorIndex] = newColor;
    }

    // Valide l'index (ou la gomme '') avant de changer le pinceau.
    function updateCurrentColor(color) {
        if (color === '' || (color >= 0 && color < colors.value.length)) {
            currentColor.value = color;
        }
    }

    function addColor() {
        colors.value.push(getRandomColor());
        updateCurrentColor(colors.value.length - 1);
    }

    // Ajoute deux couleurs de départ (mode édition d'une nouvelle grille).
    function seedInitialColors() {
        colors.value.push(getRandomColor());
        colors.value.push(getRandomColor());
    }

    return {
        colors,
        currentColor,
        getRandomColor,
        updateColors,
        updateCurrentColor,
        addColor,
        seedInitialColors,
    };
}
