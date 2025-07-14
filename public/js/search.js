const searchInput = document.getElementById('searchInput');
const recipeList = document.getElementById('recipeList');

document.getElementById('searchInput').addEventListener('input', async function () {
  const query = this.value.trim();

  const res = await fetch(`/search?query=${encodeURIComponent(query)}`);
  const recipes = await res.json();

  const recipeList = document.getElementById('recipeList');
  recipeList.innerHTML = ''; // clear old results

  recipes.forEach(r => {
    const option = document.createElement('option');
    option.textContent = r.title;
    recipeList.appendChild(option);
  });
});
