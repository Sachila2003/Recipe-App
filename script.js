//API configuration
const API_CONFIG = {
    APP_ID: '6b9adddc',
    APP_KEY: '2212a65a4b2ed69c734cba98a3686c06',
    USER_ID: 'sachila',
    BASE_URL: 'https://api.edamam.com/api/recipes/v2',
}

//DOM elements use
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const recipeContainer = document.getElementById('recipe-container');
const quickSearchBtns = document.querySelectorAll('.quick-search');
const showFavoritesBtn = document.getElementById('show-favorites');
const recipeModal = new bootstrap.Modal(document.getElementById('recipeModal'));
const recipeModalTitle = document.getElementById('recipeModalTitle');
const recipeModalBody = document.getElementById('recipeModalBody');
const saveRecipeBtn = document.getElementById('save-recipe-btn');
const favoritesModal = new bootstrap.Modal(document.getElementById('favoritesModal'));
const favoritesModalBody = document.getElementById('favoritesModalBody');
const noFavoritesMessage = document.getElementById('no-favorites-message');



let currentRecipes = [];
let currentRecipeDetails = null;
let favorites = JSON.parse(localStorage.getItem('recipeFavorites'));

function init() {
    //set event listeners
    searchBtn.addEventListener('click', handleSearch);
    searchInput.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') handleSearch();
    });

    quickSearchBtns.forEach(btn => {
        btn.addEventListener('click', function () {
            searchInput.value = this.dataset.query;
            handleSearch();
        })
    });

    showFavoritesBtn.addEventListener('click', showFavorites);
    saveRecipeBtn.addEventListener('click', toggleFavorite);

    renderFavorites();
}

function handleSearch() {
    const query = searchInput.value.trim();
    if (query) {
        fetchRecipes(query);
    } else {
        alert('Please enter a search term!');
    }
}

async function fetchRecipes(query) {
    try {
        showLoadingState();

        const url = new URL(API_CONFIG.BASE_URL);
        url.searchParams.append('type', 'public');
        url.searchParams.append('q', query);
        url.searchParams.append('app_id', API_CONFIG.APP_ID);
        url.searchParams.append('app_key', API_CONFIG.APP_KEY);
        url.searchParams.append('to', '12');

        const response = await fetch(url, {
            headers: {
                'Edamam-Account-User': API_CONFIG.USER_ID
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to fetch recipes');
        }

        const data = await response.json();
        currentRecipes = data.hits.map(hit => hit.recipe);

        if (currentRecipes.length === 0) {
            showResultMessage(query);
        } else {
            renderRecipe(currentRecipes);
        }

    } catch (error) {
        showErrorMessage(error);
    }
}


function showLoadingState() {
    recipeContainer.innerHTML = `<div class="col-12 text-center">
        <div class="col-12 text-center">
            <i class="bi bi-hourglass-split display-4"></i>
            <h3 class="mt-3">Loading recipes...</h3>
        </div>
        <p class ="mt-2">Searching for recipes...</p>
    </div>`;
}

function showResultMessage(query) { }

function showErrorMessage(error) {
    console.error('Error:', error);
    recipeContainer.innerHTML = `<div class="col-12 text-center text-danger">
        <i class="bi bi-exclamation-triangle display-4"></i>
        <h3 class="mt-3">Error fetching recipes. Please try again later.</h3>
        </div>`;
}

function renderRecipe(recipes) {
    recipeContainer.innerHTML = '';

    recipes.forEach(recipe => {
        const isFavorite = favorites && favorites.some(fav => fav.uri === recipe.uri);

        const recipeCard = document.createElement('div');
        recipeCard.className = 'col-md-6 col-lg-4 mb-4';
        recipeCard.innerHTML = `
            <div class="recipe-card card h-100">
                <img src=${recipe.image} class="recipe-img card-img-top" alt="${recipe.label}">
                <div class="card-body">
                    <h5 class="card-title">${recipe.label}</h5>
                    <p class="card-text text-muted">${recipe.source}</p>
                    <div class="d-flex flex-wrap mb-2">
                        ${recipe.healthLabels.slice(0, 3).map(label => `
                            <span class="badge bg-light text-dark health-label">${label}</span>
                            `).join('')}
                    </div>
                    <button class = "btn btn-outline-success btn-sm view-recipe" data-uri="${recipe.uri}">View Recipe
                    <i class="bi bi-eye"></i>
                    </button>

                    ${isFavorite ? `<button class="btn btn-outline-danger btn-sm ms-2 favorite-recipe" data-uri="${recipe.uri}">Remove from Favorites
                     <i class="bi bi-heart-fill"></i>
                     </button>`: `
                     
                    <button class="btn btn-outline-success btn-sm ms-2 favorite-recipe" data-uri="${recipe.uri}">Add to Favorites
                    <i class="bi bi-heart"></i>
                    </button>`}
                    
                </div>
            </div> 
        `;

        recipeContainer.appendChild(recipeCard);
    });
    addRecipeEventListeners();
}

function addRecipeEventListeners() {
    document.querySelectorAll('.view-recipe').forEach(btn => {
        btn.addEventListener('click', function () {
            const uri = this.dataset.uri;
            showRecipeDetails(uri);
        });
    });

    document.querySelectorAll('.favorite-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            const uri = this.dataset.uri;
            toggleFavorite(uri);
        })
    })
}

function showRecipeDetails(uri) {
    const recipe = currentRecipes.find(r => r.uri === uri); //ewana uri eka current recipe load karagnnw
    if (!recipe) return;

    currentRecipeDetails = recipe;
    recipeModalTitle.textContent = recipe.label;

    const isFavorite = favorites && favorites.some(fav => fav.uri === recipe.uri);
    saveRecipeBtn.innerHTML = isFavorite ?
        `<i class="bi bi-heart-fill"></i> Remove from Favorites` :
        `<i class="bi bi-heart"></i> Add to Favorites`;
    recipeModalBody.innerHTML = createRecipeModalContent(recipe);
    recipeModal.show();

}

function createRecipeModalContent(recipe) {
    const ingredientList = recipe.ingredientLines.map(ing =>
        `<li class ="list-group-item">${ing}</li>`).join('');
    const nutritionBadge = Object.entries(recipe.totalNutrients).slice(0, 8)
        .map(([key, nut]) => `
        <span class = "badge bg-light text-dark nutrition-badge">
        ${nut.label}: ${Math.round(nut.quantity)} ${nut.unit}
        </span>`).join('');

    return `
    <div class="row">
    <div class ="col-md-6">
        <img src="${recipe.image}" class="img-fluid rounded-start" alt="${recipe.label}">
        <div class="mb-3">
            <h6>Diet & Health</h6>
            <div class="d-flex-wrap">
                ${recipe.healthLabels.slice(0, 5).map(label => `
                <span class="badge bg-light text-dark health-label mb-1">
                ${label}</span>`).join('')}
            </div>
        </div>
        <div class="mb-3">
            <h6>nutrition Information :</h6>
            <div class="d-flex flex-wrap">
                ${nutritionBadge}
            </div>
        </div>
    </div>
    <div class="col-md-6">
        <h5>Ingredients:</h5>
        <ul class="list-group list-group-flush">
            ${ingredientList}
        </ul>
        <a href="${recipe.url}" target="_blank" class="btn btn-success">
        <i class="bi bi-link-45deg"></i> View Full Recipe on ${recipe.source}
        </a>
    </div>`;


}

function toggleFavourite(uri) {
    if (!uri && currentRecipesDetails) {
        uri = currentRecipesDetails.uri;
    }
    const recipe = currentRecipes.find(r => r.uri === uri) || currentRecipesDetails;
    if (!recipe) return;

    const favoriteIndex = favorites.findIndex(fav => fav.uri === uri);

    if (favoriteIndex === -1) {
        favorites.unshift({
            uri: recipe.uri,
            label: recipe.label,
            image: recipe.image,
            source: recipe.source,
            url: recipe.url
        });
    } else {
        favorites.splice(favoriteIndex, 1);
    }
    saveFavorites();
    updateFavoritesUI(uri,favoriteIndex === -1);
}


function saveFavorites() {
    localStorage.setItem('recipeFavorites', JSON.stringify(favorites));
    renderFavorites();
}

function showFavorites() { }

function updateFavoritesUI(uri, isNowFavorites){
    //update model button
    if(currentRecipeDetails && currentRecipeDetails.uri === uri){
        saveRecipeBtn.innerHTML = isNowFavorites ?
        `<i class="bi bi-heart-fill"></i> Remove from Favorites`:
        `<i class="bi bi-heart"></i> Save to Favorites`;
    }

    const favoriteBtn = document.querySelector(`.favorite-btn[data-uri="${uri}"]`);
    if(favoriteBtn){
        favoriteBtn.innerHTML = isNowFavorites ?
        `<i class="bi bi-heart-fill"></i> Saved`:
        `<i class="bi bi-heart"></i> Save`;
        favoriteBtn.classList.toggle('btn-outline-secondary', !isNowFavorites);
        favoriteBtn.classList.toggle('btn-success', isNowFavorites);
    }
}


function renderFavorites(){
    if(favorites.length === 0){
        noFavoritesMessage.style.display = 'block';
        favoritesModalBody.innerHTML = '';
        favoritesModalBody.appendChild(noFavoritesMessage);
        return;
    }

    noFavoritesMessage.style.display = 'none';

    const favoritesList = document.createElement('div');
    favoritesList.className = 'list-group';

    favorites.forEach(fav => {
        const favoriteItem = document.createElement('div');
        favoriteItem.className = 'list-group-item favotite-card';
        favoriteItem.innerHTML = `
            <div class="d-flex align-items-center">
                <img src="${fav.image}" class="favorite-image me-3" alt="${fav.label}">
                <div class="flex-grow-1">
                    <h5>${fav.label}</h5>
                    <p class="mb-1 text-muted">${fav.source}</p>
                    <div class="d-flex">
                        <a href="${fav.url}" target="_blank" 
                        class="btn btn-sm btn-outline-success me-2">
                        <i class="bi bi-link"></i>
                        </a>
                        <button class="btn btn-sm btn-outline-danger remove-favorite" 
                        data-uri="${fav.uri}"><i class="bi bi-trash"></i>Remove</button>
                    </div>
                </div>
            </div>
        `;
        favoritesList.appendChild(favoriteItem);
    });

    favoritesModalBody.innerHTML = '';
    favoritesModalBody.appendChild(favoritesList);

    document.querySelectorAll('.remove-favorite').forEach(btn => {
        btn.addEventListener('click', function(){
            const uri = this.dataset.uri;
            toggleFavourite(uri);
        })
    })
}


function renderFavorites() { }

//initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', init);



