/**
 * TODO:Features
 *  1. Add a class to the current day based 
 *     on the timezone and current time at the 
 *     location using Timezone API
 */

let restaurant;
var map;

/**
 * Initialize Google map, called from HTML.
 */
window.initMap = () => {
  fetchRestaurantFromURL((error, restaurant) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.map = new google.maps.Map(document.body.querySelector('#map'), {
        zoom: 16,
        center: restaurant.latlng,
        scrollwheel: false
      });
      fillBreadcrumb();
      DBHelper.mapMarkerForRestaurant(self.restaurant, self.map);
    }

    // Remove tab index from map items after tiles have ben loaded
  google.maps.event.addListener(self.map, 'tilesloaded', () => {

    //A little sloppy, but the timeout makes sure the controls are loaded
    setTimeout(() => {

      //Remove tab index from: iframe and div
      document.querySelector('#map .gm-style div:first-child').setAttribute('tabindex', -1);
      document.querySelector('#map .gm-style iframe').setAttribute('tabindex', -1);

      //Tab through divs first
      document.querySelectorAll('#map .gm-style div[role="button"]')
        .forEach((el) => {
          el.setAttribute('tabindex', 0);
          el.classList.add = "map-control";
        }); //map & satellite

      //Then Buttons
      document.querySelectorAll('#map .gm-style button')
        .forEach((el) => {
          el.setAttribute('tabindex', 0);
          el.classList.add = "map-control";
        }); //zoom in, zoomout, full screen

      //Finally a's (currently not focusable)
      document.querySelectorAll('#map .gm-style a[href]')
        .forEach((el) => {
          el.setAttribute('tabindex', -1);
          el.classList.add = "map-link";
        }); //zoom in, zoomout, full screen
    }, 500);
  });
  });


}

/**
 * Get current restaurant from page URL.
 */
fetchRestaurantFromURL = (callback) => {
  if (self.restaurant) { // restaurant already fetched!
    callback(null, self.restaurant)
    return;
  }
  const id = getParameterByName('id');
  if (!id) { // no id found in URL
    error = 'No restaurant id in URL'
    callback(error, null);
  } else {
    DBHelper.fetchRestaurantById(id, (error, restaurant) => {
      self.restaurant = restaurant;
      if (!restaurant) {
        console.error(error);
        return;
      }
      fillRestaurantHTML();
      callback(null, restaurant)
    });
  }
}

/**
 * Create restaurant HTML and add it to the webpage
 */
fillRestaurantHTML = (restaurant = self.restaurant) => {
  const name = document.body.querySelector('.restaurant-name');
  name.innerHTML = restaurant.name;

  const address = document.body.querySelector('.restaurant-address');

  //Add a soft break before state + zip (without RegEx)
  const addressStr_pre = restaurant.address.split("").reverse().join("").replace(","," >rbw<,").split("").reverse().join("");
  address.innerHTML = addressStr_pre;

  const image = document.body.querySelector('.restaurant-img');
  image.className = 'restaurant-img';
  image.src = DBHelper.imageUrlForRestaurant(restaurant);

  const cuisine = document.body.querySelector('.restaurant-cuisine');
  cuisine.innerHTML = restaurant.cuisine_type;

  // fill operating hours
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML();
  }
  // fill reviews
  fillReviewsHTML();
}

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
  const hours = document.body.querySelector('.restaurant-hours');
  for (let key in operatingHours) {
    const row = document.createElement('tr');

    const day = document.createElement('td');
    day.className = 'hours-day';
    day.innerHTML = key;
    row.appendChild(day);

    const timeList = document.createElement('ul');
    for (let timeRange of operatingHours[key].split(",")) {
      const timeItem = document.createElement('li');
      timeItem.innerHTML = timeRange.trim();
      timeList.appendChild(timeItem);
    }

    const time = document.createElement('td');
    time.className = 'hours-time';
    time.appendChild(timeList);
    row.appendChild(time);

    hours.appendChild(row);
  }
}

/**
 * Create all reviews HTML and add them to the webpage.
 */
fillReviewsHTML = (reviews = self.restaurant.reviews) => {
  const container = document.body.querySelector('.reviews-container');
  const title = document.createElement('h2');
  title.innerHTML = 'Reviews';
  container.appendChild(title);

  if (!reviews) {
    const noReviews = document.createElement('p');
    noReviews.innerHTML = 'No reviews yet!';
    container.appendChild(noReviews);
    return;
  }
  const ul = document.body.querySelector('.reviews-list');
  reviews.forEach(review => {
    ul.appendChild(createReviewHTML(review));
  });
  container.appendChild(ul);
}

/**
 * Create review HTML and add it to the webpage.
 */
createReviewHTML = (review) => {
  const li = document.createElement('li');
  const name = document.createElement('h3');
  name.innerHTML = review.name;
  li.appendChild(name);

  const date = document.createElement('p');
  date.innerHTML = review.date;
  li.appendChild(date);



  const rating_wrapper = document.createElement('div');
  rating_wrapper.className = 'rating';

  const ratingIcon = document.createElement('p');
  ratingIcon.innerHTML = DBHelper.rating2stars(review.rating);
  ratingIcon.className = 'rating-stars';
  rating_wrapper.append(ratingIcon);

  const ratingText = document.createElement('p');
  ratingText.innerHTML = `${review.rating} Stars`;
  ratingText.className = 'rating-text';
  rating_wrapper.append(ratingText);

  li.append(rating_wrapper);


  const comments = document.createElement('p');
  comments.className = "review-comments";
  comments.classList.add("fade-ellipsis");
  comments.innerHTML = review.comments;
  comments.setAttribute("tabindex", 0);

  comments.addEventListener("click", function toggleEllispis(event) {
    event.target.classList.toggle("fade-ellipsis");
  })

  li.appendChild(comments);

  return li;
}


/**
 * Add restaurant name to the breadcrumb navigation menu
 */
fillBreadcrumb = (restaurant = self.restaurant) => {
  const breadcrumb = document.querySelector('.breadcrumb');
  const li = document.createElement('li');
  li.innerHTML = restaurant.name;
  breadcrumb.appendChild(li);
}

/**
 * Get a parameter by name from page URL.
 */
getParameterByName = (name, url) => {
  if (!url)
    url = window.location.href;
  name = name.replace(/[\[\]]/g, '\\$&');
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
    results = regex.exec(url);
  if (!results)
    return null;
  if (!results[2])
    return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
}