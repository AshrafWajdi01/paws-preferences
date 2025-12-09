let likedCats = [];
let dislikedCats = [];
let catDeck = [];
let currentIndex = 0;

function generateCatUrl(catId, category, index) {
    const base = `https://cataas.com/cat/${catId}`;
    const timestamp = Date.now() + index;
    
    switch(category) {
        case 'gif':
            return `https://cataas.com/cat/gif?t=${timestamp}`;
        
        case 'motivational':
            const quotes = [
                "You Can Do It!", "Stay Strong!", "Keep Going!", 
                "Believe In Yourself!", "Never Give Up!", "You're Awesome!",
                "Dream Big!", "Make It Happen!", "Be Fearless!", "Stay Positive!"
            ];
            const quote = quotes[index % quotes.length];
            const colors = ['white', 'yellow', 'cyan', 'lime', 'pink', 'orange'];
            const color = colors[index % colors.length];
            const fontSize = 25 + (index % 4) * 5;
            return `https://cataas.com/cat/says/${encodeURIComponent(quote)}?fontSize=${fontSize}&fontColor=${color}&t=${timestamp}`;
        
        case 'meme':
            const memes = [
                "I can has cheezburger?", "Nope!", "Not Today!", 
                "Hooman!", "Feed Me!", "I'm watching you", 
                "Pet me NOW", "Nap Time", "I regret nothing", "Why tho?"
            ];
            const meme = memes[index % memes.length];
            return `https://cataas.com/cat/says/${encodeURIComponent(meme)}?fontSize=30&fontColor=white&t=${timestamp}`;
        
        case 'filtered':
            const filters = ['blur', 'mono', 'negate'];
            const filter = filters[index % filters.length];
            return `${base}?filter=${filter}&t=${timestamp}`;
        
        case 'cute':
        case 'funny':
            return `${base}?type=square&t=${timestamp}`;
        
        default:
            return `${base}?t=${timestamp}`;
    }
}

async function preloadCats(category) {
    try {
        let apiUrl;

        if (category === 'gif' || category === 'motivational' || category === 'meme' || category === 'filtered') {
            apiUrl = 'https://cataas.com/api/cats?limit=10';
        } else if (category) {
            apiUrl = `https://cataas.com/api/cats?limit=10&tags=${category}`;
        } else {
            apiUrl = 'https://cataas.com/api/cats?limit=10';
        }

        const res = await fetch(apiUrl);
        if (!res.ok) throw new Error('API failed');

        const json = await res.json();

        console.log('Full API response:', json);

        return json.map((cat, index) => {
            console.log('Cat object:', cat);
            return {
                id: cat.id,
                tags: cat.tags,
                created_at: cat.created_at,
                url: generateCatUrl(cat.id, category, index)
            };
        });
    } catch (error) {
        console.error('Failed to load cats:', error);
        const res = await fetch('https://cataas.com/api/cats?limit=10');
        const json = await res.json();
        return json.map((cat, index) => ({
            id: cat.id,
            url: `https://cataas.com/cat/${cat.id}?t=${Date.now() + index}`
        }));
    }
}

// NEW FUNCTION: Flash background color
function flashBackground(color) {
    const swipeScreen = document.querySelector('.swipe-screen');
    if (!swipeScreen) return;
    
    // Set the color
    swipeScreen.style.transition = 'background-color 0.2s ease';
    swipeScreen.style.backgroundColor = color;
    
    // Reset to white after 0.5 seconds
    setTimeout(() => {
        swipeScreen.style.backgroundColor = '#f5f5f5';
    }, 500);
}

async function startApp(category) {
    const app = document.getElementById('app');
    
    likedCats = [];
    dislikedCats = [];
    currentIndex = 0;

    app.innerHTML = '<div class="loading"><h2>Loading cats... 🐾</h2></div>';

    catDeck = await preloadCats(category);

    renderSwipeScreen(app);
}

function renderSwipeScreen(app) {
    app.innerHTML = `
        <div class="swipe-screen">
            <div class="swipe-header">
                <button id="home-btn">Home</button>
                <h2>Paws & Preferences</h2>
                <span class="counter">${currentIndex + 1} / ${catDeck.length}</span>
            </div>
            <div id="cat-card"></div>
        </div>
    `;

    const homeBtn = document.getElementById('home-btn');
    homeBtn.addEventListener('click', () => {
        window.location.href = window.location.pathname + '?t=' + Date.now();
    });

    loadCurrentCat();
}

function loadCurrentCat() {
    if (currentIndex >= catDeck.length){
        return showSummary();
    }

    const cardContainer = document.getElementById('cat-card');
    cardContainer.innerHTML = '';

    const card = document.getElementById('cat-card');
    const cat = catDeck[currentIndex];
    
    card.innerHTML = `
        <div id="swipe-card" class="swipe-card">
            <img src="${cat.url}" alt="cat ${currentIndex + 1}" />
            <div id="like-overlay" class="swipe-overlay like">LIKE</div>
            <div id="dislike-overlay" class="swipe-overlay dislike">NOPE</div>
        </div>
        <div class="action-buttons">
            <button id="dislike-btn" class="action-btn">😕</button>
            <button id="like-btn" class="action-btn">😍</button>
        </div>
    `;

    addSwipeListeners(document.getElementById('swipe-card'));

    const likeBtn = document.getElementById('like-btn');
    const dislikeBtn = document.getElementById('dislike-btn');
    likeBtn.addEventListener('click', handleLike);
    dislikeBtn.addEventListener('click', handleDislike);

    const counter = document.querySelector('.counter');
    if (counter) {
        counter.textContent = `${currentIndex + 1} / ${catDeck.length}`;
    }

    resetCardState();
}

function resetCardState() {
    const card = document.getElementById('swipe-card');
    const likeOverlay = document.getElementById('like-overlay');
    const dislikeOverlay = document.getElementById('dislike-overlay');

    if (card) {
        card.classList.remove('transition');
        card.style.transform = 'translateX(0px) rotate(0deg)';
    }

    if (likeOverlay) likeOverlay.style.opacity = 0;
    if (dislikeOverlay) dislikeOverlay.style.opacity = 0;
}

function animateButtonSwipe(direction) {
    const card = document.getElementById('swipe-card');
    const likeOverlay = document.getElementById('like-overlay');
    const dislikeOverlay = document.getElementById('dislike-overlay');

    card.classList.add('transition');

    if (direction === 'right') {
        likeOverlay.style.opacity = 1;
        card.style.transform = 'translateX(500px) rotate(40deg)';
    } else {
        dislikeOverlay.style.opacity = 1;
        card.style.transform = 'translateX(-500px) rotate(-40deg)';
    }
}

function handleLike() {
    flashBackground('#aff3c8ff');
    
    animateButtonSwipe('right');

    setTimeout(() => {
        const cat = catDeck[currentIndex];
        likedCats.push(cat.url);
        currentIndex++;
        loadCurrentCat();
    }, 250); 
}

function handleDislike() {
    flashBackground('#ecb4b4ff');
    
    animateButtonSwipe('left');

    setTimeout(() => {
        const cat = catDeck[currentIndex];
        dislikedCats.push(cat.url);
        currentIndex++;
        loadCurrentCat();
    }, 250);
}

function addSwipeListeners(card) {
    let startX = 0;
    let currentX = 0;
    let dragging = false;

    const likeOverlay = document.getElementById('like-overlay');
    const dislikeOverlay = document.getElementById('dislike-overlay');

    const dragStart = (e) => {
        dragging = true;
        startX = e.touches ? e.touches[0].clientX : e.clientX;
        card.classList.remove('transition');
    };

    const dragMove = (e) => {
        if (!dragging) return;
        currentX = e.touches ? e.touches[0].clientX : e.clientX;
        const dx = currentX - startX;
        card.style.transform = `translateX(${dx}px) rotate(${dx / 20}deg)`;
        
        if (dx > 50) {
            likeOverlay.style.opacity = Math.min(dx / 120, 1);
            dislikeOverlay.style.opacity = 0;
        } else if (dx < -50) {
            dislikeOverlay.style.opacity = Math.min(Math.abs(dx) / 120, 1);
            likeOverlay.style.opacity = 0;
        } else {
            likeOverlay.style.opacity = 0;
            dislikeOverlay.style.opacity = 0;
        }
    };

    const dragEnd = () => {
        if (!dragging) return;
        dragging = false;
        const dx = currentX - startX;

        if (dx > 120) {
            flashBackground('#aff3c8ff');
            
            card.classList.add('transition');
            card.style.transform = 'translateX(500px) rotate(40deg)';
            setTimeout(handleLikeSwipe, 200);
        } else if (dx < -120) {
            flashBackground('#ecb4b4ff');
            
            card.classList.add('transition');
            card.style.transform = 'translateX(-500px) rotate(-40deg)';
            setTimeout(handleDislikeSwipe, 200);
        } else {
            card.classList.add('transition');
            card.style.transform = 'translateX(0px) rotate(0deg)';
            likeOverlay.style.opacity = 0;
            dislikeOverlay.style.opacity = 0;
        }
    };

    card.addEventListener('mousedown', dragStart);
    document.addEventListener('mousemove', dragMove);
    document.addEventListener('mouseup', dragEnd);

    card.addEventListener('touchstart', dragStart);
    card.addEventListener('touchmove', dragMove);
    card.addEventListener('touchend', dragEnd);
}

function handleLikeSwipe() {
    const cat = catDeck[currentIndex];
    likedCats.push(cat.url);
    currentIndex++;
    loadCurrentCat();
}

function handleDislikeSwipe() {
    const cat = catDeck[currentIndex];
    dislikedCats.push(cat.url);
    currentIndex++;
    loadCurrentCat();
}

function showSummary() {
    const app = document.getElementById('app');
    app.innerHTML = `
        <div class="summary">
            <h2>🎉 Let see what you got!</h2>
            <p>You liked <strong>${likedCats.length}</strong> cats and passed on <strong>${dislikedCats.length}</strong></p>

            ${likedCats.length > 0 ? `
                <h3>❤️ Your Matches (${likedCats.length})</h3>
                <div class="grid">
                    ${likedCats.map(url => `<img src="${url}" alt="liked cat">`).join('')}
                </div>
            ` : '<p style="color: white; margin: 20px 0;">No matches yet 😢</p>'}

            ${dislikedCats.length > 0 ? `
                <h3>✕ Passed (${dislikedCats.length})</h3>
                <div class="grid">
                    ${dislikedCats.map(url => `<img src="${url}" alt="disliked cat">`).join('')}
                </div>
            ` : ''}

            <button id="restart-btn">Start Over</button>
        </div>
    `;

    document.getElementById('restart-btn').addEventListener('click', () => window.location.href = window.location.href.split('?')[0] + '?t=' + Date.now());
}

async function setButtonBackgrounds() {
    const buttons = document.querySelectorAll('.category-btn');
    
    buttons.forEach(btn => {
        btn.style.backgroundColor = 'rgba(0,0,0,0.5)';
    });

    for (let btn of buttons) {
        let category = btn.getAttribute('onclick').match(/startApp\('(.+?)'\)/)?.[1] || '';

        let fetchCategory = (category === 'motivational') ? 'cute' : category;

        let apiUrl = fetchCategory 
            ? `https://cataas.com/api/cats?tags=${fetchCategory}&limit=10` 
            : 'https://cataas.com/api/cats?limit=10';

        try {
            const res = await fetch(apiUrl);
            const cats = await res.json();
            
            if (cats.length > 0) {
                const randomCat = cats[Math.floor(Math.random() * cats.length)];
                const catUrl = `https://cataas.com/cat/${randomCat.id}?type=square&t=${Date.now()}`;
                btn.style.backgroundImage = `url('${catUrl}')`;
            }
        } catch (err) {
            console.error(`Failed to fetch cat for category ${category}:`, err);
            btn.style.background = 'linear-gradient(135deg, #ff6b9d 0%, #c06c84 100%)';
        }
    }
}