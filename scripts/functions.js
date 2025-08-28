function filterRecipes() {
    const query = document.getElementById('searchInput').value.trim().toLowerCase();
    const recipes = document.querySelectorAll('.recipe');

    recipes.forEach(recipe => {
        const recipeName = recipe.querySelector('h3').textContent.toLowerCase();
        if (recipeName.includes(query)) {
            recipe.style.display = 'block';
        } else {
            recipe.style.display = 'none';
        }
    });
}

async function handleEdit(event) {
    const recipeId = event.target.getAttribute('data-id'); // Get the ID of the recipe
    const recipeElement = event.target.parentElement;

    // Fetch the recipe details
    const response = await fetch(`http://localhost:3000/recipes/${recipeId}`);
    const recipe = await response.json();

    // Replace the recipe display with an edit form
    recipeElement.innerHTML = `
        <form id="editForm-${recipeId}">
            <label for="edit-title-${recipeId}">Title:</label>
            <input type="text" id="edit-title-${recipeId}" name="title" value="${recipe.title}" required>
            
            <label for="edit-description-${recipeId}">Description:</label>
            <textarea id="edit-description-${recipeId}" name="description" required>${recipe.description}</textarea>

            <label for="edit-category-${recipeId}">Category:</label>
            <select id="edit-category-${recipeId}" name="category" required>
                <option value="breakfast" ${recipe.category === 'breakfast' ? 'selected' : ''}>Breakfast</option>
                <option value="lunch" ${recipe.category === 'lunch' ? 'selected' : ''}>Lunch</option>
                <option value="dinner" ${recipe.category === 'dinner' ? 'selected' : ''}>Dinner</option>
                <option value="dessert" ${recipe.category === 'dessert' ? 'selected' : ''}>Dessert</option>
            </select>

            <button type="submit">Save</button>
        </form>
    `;

    // Add event listener for the save button
    const editForm = document.getElementById(`editForm-${recipeId}`);
    editForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const updatedRecipe = {
            title: document.getElementById(`edit-title-${recipeId}`).value,
            description: document.getElementById(`edit-description-${recipeId}`).value,
            category: document.getElementById(`edit-category-${recipeId}`).value,
        };

        // Send the updated data to the server
        const res = await fetch(`http://localhost:3000/recipes/${recipeId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedRecipe),
        });

        if (res.ok) {
            const updatedData = await res.json();
            // Replace the form with the updated recipe details
            recipeElement.innerHTML = `
                <img src="http://localhost:3000/${recipe.image_path}" alt="${updatedData.title}">
                <h3>${updatedData.title}</h3>
                <p>${updatedData.description}</p>
                <p><strong>Category:</strong> ${updatedData.category.charAt(0).toUpperCase() + updatedData.category.slice(1)}</p>
                <button class="edit-button" data-id="${updatedData.id}">Edit</button>
                <button class="delete-button" data-id="${updatedData.id}">Delete</button>
            `;

            // Reattach the edit button handler
            recipeElement.querySelector('.edit-button').addEventListener('click', handleEdit);
            // Reattach the delete button handler
            recipeElement.querySelector('.delete-button').addEventListener('click', handleDelete);
        } else {
            console.error('Failed to update recipe');
        }
    });
}

async function handleDelete(event) {
    const recipeId = event.target.getAttribute('data-id'); // Get the recipe ID
    const recipeElement = event.target.parentElement; // Get the parent element (article)

    try {
        // Send a DELETE request to the server
        const response = await fetch(`http://localhost:3000/recipes/${recipeId}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            const result = await response.json();
            console.log('Recipe deleted:', result);

            // Remove the recipe element from the DOM
            recipeElement.remove();
        } else {
            const error = await response.json();
            console.error('Failed to delete recipe:', error);
        }
    } catch (error) {
        console.error('Error deleting recipe:', error);
    }
}

//event listener to search recipes
document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('searchInput'); // Search input element
    const recipeList = document.getElementById('recipeList'); // Element to display recipes

    // Attach an event listener to capture user input
    searchInput.addEventListener('input', async (event) => {
        const query = event.target.value.trim(); // User's input

        if (!query) {
            recipeList.innerHTML = '<p>Type something to search...</p>';
            return;
        }

        // Call the backend with the user's query
        try {
            const response = await fetch(`http://localhost:3000/recipes/search?query=${encodeURIComponent(query)}`);
            if (!response.ok) {
                throw new Error('Failed to fetch search results');
            }

            const recipes = await response.json();

            // Render the recipes
            recipeList.innerHTML = ''; // Clear previous results
            if (recipes.length === 0) {
                recipeList.innerHTML = '<p>No recipes found.</p>';
                return;
            }

            recipes.forEach(recipe => {
                const article = document.createElement('article');
                article.classList.add('recipe');
                article.innerHTML = `
                    <img src="http://localhost:3000/${recipe.image_path}" alt="${recipe.title}">
                    <h3>${recipe.title}</h3>
                    <p>${recipe.description}</p>
                    <p><strong>Category:</strong> ${recipe.category.charAt(0).toUpperCase() + recipe.category.slice(1)}</p>
                    <button class="edit-button" data-id="${recipe.id}">Edit</button>
                    <button class="delete-button" data-id="${recipe.id}">Delete</button>
                `;
                recipeList.appendChild(article);
            });

            // Add event listeners for Edit and Delete buttons (if needed)
            document.querySelectorAll('.edit-button').forEach(button => {
            button.addEventListener('click', handleEdit); // Replace with your edit handler
            });
            document.querySelectorAll('.delete-button').forEach(button => {
            button.addEventListener('click', handleDelete); // Replace with your delete handler
            });

        } catch (error) {
            console.error('Error fetching recipes:', error);
            recipeList.innerHTML = '<p>Failed to load recipes. Please try again later.</p>';
        }
    });
});

window.onload = function() {
    document.getElementById('searchInput').addEventListener('input', filterRecipes);
};