document.querySelectorAll('.rating-form').forEach(form => {
  const stars = form.querySelectorAll('.star');
  const ratingValue = form.querySelector('.rating-value');
  const recipeId = form.dataset.recipeId;
  const avgRatingElement = form.querySelector('.avg-rating');

  const initialRating = parseInt(ratingValue.value);
  if (initialRating) {
    stars.forEach((star, index) => {
      if (index < initialRating) star.classList.add('active');
    });
  }

  stars.forEach(star => {
    star.addEventListener('click', async (e) => {
      const value = e.target.dataset.value;

      stars.forEach(s => s.classList.remove('active'));
      for (let i = 0; i < value; i++) {
        stars[i].classList.add('active');
      }

      try {
        const response = await fetch(`/rate/${recipeId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rating: value })
        });

        const data = await response.json();
        if (data.message === 'Rating saved') {
          ratingValue.value = data.userRating;

          if (avgRatingElement) {
            avgRatingElement.textContent = `(${data.avgRating})`;
          }
        }

      } catch (error) {
        console.error('Rating failed:', error);
      }
    });
  });
});
