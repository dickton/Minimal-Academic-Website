// Global variables
let allPublications = [];
const HIGHLIGHT_AUTHOR = 'Jiaxiong Tang';

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
  refreshStaticImage('profile-image');
  loadLastUpdated();

  // Load publications data
  loadPublications();
  
  // Initialize animation delays for sections
  const sections = document.querySelectorAll('section');
  sections.forEach((section, index) => {
    section.style.animationDelay = `${index * 0.1}s`;
  });
});

function refreshStaticImage(imageId) {
  const image = document.getElementById(imageId);
  if (!image) {
    return;
  }

  const src = image.getAttribute('src');
  if (!src) {
    return;
  }

  const separator = src.includes('?') ? '&' : '?';
  image.src = `${src}${separator}v=${Date.now()}`;
}

function loadLastUpdated() {
  const lastUpdatedElement = document.getElementById('last-updated');
  if (!lastUpdatedElement) {
    return;
  }

  const repo = lastUpdatedElement.dataset.githubRepo;
  if (!repo) {
    return;
  }

  const apiUrl = `https://api.github.com/repos/${repo}/commits?per_page=1`;

  fetch(apiUrl, {
    cache: 'no-store',
    headers: {
      Accept: 'application/vnd.github+json'
    }
  })
    .then(response => {
      if (!response.ok) {
        throw new Error(`GitHub API request failed: ${response.status}`);
      }
      return response.json();
    })
    .then(commits => {
      if (!Array.isArray(commits) || commits.length === 0) {
        throw new Error('No commits returned from GitHub API.');
      }

      const latestCommit = commits[0];
      const commitDate = latestCommit.commit && latestCommit.commit.committer
        ? latestCommit.commit.committer.date
        : null;

      if (!commitDate) {
        throw new Error('Latest commit did not include a committer date.');
      }

      const formattedDate = formatMonthYear(commitDate);
      lastUpdatedElement.textContent = formattedDate;
      lastUpdatedElement.dateTime = new Date(commitDate).toISOString();
      lastUpdatedElement.title = `Latest commit: ${formatLongDate(commitDate)}`;
    })
    .catch(error => {
      console.warn('Unable to update last updated footer from GitHub:', error);
      const fallbackLabel = lastUpdatedElement.dataset.fallbackLabel;
      if (fallbackLabel) {
        lastUpdatedElement.textContent = fallbackLabel;
      }
    });
}

function formatMonthYear(dateString) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC'
  }).format(new Date(dateString));
}

function formatLongDate(dateString) {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC'
  }).format(new Date(dateString));
}

// Load publications from JSON file
function loadPublications() {
  fetch('publications.json', { cache: 'no-store' })
    .then(response => {
      if (!response.ok) {
        throw new Error(`Network response was not ok: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      if (!data || !Array.isArray(data.publications)) {
        throw new Error('Invalid publications.json format: expected a publications array.');
      }
      console.log("Publications loaded successfully:", data);
      allPublications = data.publications;
      renderPublications();
    })
    .catch(error => {
      console.error('Error loading publications:', error);
      displayFallbackPublications(error);
    });
}

// Fallback if JSON loading fails
function displayFallbackPublications(error) {
  const container = document.getElementById('publications-container');
  const message = error && error.message ? error.message : 'Unknown error';
  container.textContent = `Error loading publications: ${message}`;
}

// Render all publications
function renderPublications() {
  const publicationsContainer = document.getElementById('publications-container');
  publicationsContainer.innerHTML = '';

  if (allPublications.length === 0) {
    publicationsContainer.textContent = 'No publications to display.';
    return;
  }
  
  allPublications.forEach(publication => {
    const pubElement = createPublicationElement(publication, {
      showThumbnail: true
    });
    publicationsContainer.appendChild(pubElement);
  });
}

// Create HTML element for a publication
function createPublicationElement(publication, options = {}) {
  const { showThumbnail = true } = options;
  const pubItem = document.createElement('div');
  pubItem.className = 'publication-item';
  
  // Create content container
  const content = document.createElement('div');
  content.className = 'pub-content';
  
  // Add title
  const title = document.createElement('div');
  title.className = 'pub-title';
  title.textContent = publication.title;
  content.appendChild(title);
  
  // Add authors with highlight
  const authors = document.createElement('div');
  authors.className = 'pub-authors';
  
  // Format authors with highlighting
  let authorsHTML = '';
  publication.authors.forEach((author, index) => {
    authorsHTML += formatAuthor(author);
    
    if (index < publication.authors.length - 1) {
      authorsHTML += ', ';
    }
  });
  
  authors.innerHTML = authorsHTML;
  content.appendChild(authors);
  
  // Add venue with award if present
  const venueContainer = document.createElement('div');
  venueContainer.className = 'pub-venue-container';
  
  const venue = document.createElement('div');
  venue.className = 'pub-venue';
  venue.textContent = publication.venue;
  venueContainer.appendChild(venue);
  
  // Add award if it exists
  if (publication.award && publication.award.length > 0) {
    const award = document.createElement('div');
    award.className = 'pub-award';
    award.textContent = publication.award;
    venueContainer.appendChild(award);
  }
  
  content.appendChild(venueContainer);
  
  // Add links and publication date if they exist
  if (publication.links || publication.published) {
    const metaRow = document.createElement('div');
    metaRow.className = 'pub-meta-row';

    const links = document.createElement('div');
    links.className = 'pub-links';

    if (publication.links && publication.links.pdf) {
      const pdfLink = document.createElement('a');
      pdfLink.href = publication.links.pdf;
      pdfLink.textContent = '[PDF]';
      pdfLink.target = '_blank';
      pdfLink.rel = 'noopener noreferrer';
      links.appendChild(pdfLink);
    }
    
    if (publication.links && publication.links.code) {
      const codeLink = document.createElement('a');
      codeLink.href = publication.links.code;
      codeLink.textContent = '[Code]';
      codeLink.target = '_blank';
      codeLink.rel = 'noopener noreferrer';
      links.appendChild(codeLink);
    }
    
    if (publication.links && publication.links.project) {
      const projectLink = document.createElement('a');
      projectLink.href = publication.links.project;
      projectLink.textContent = '[Project Page]';
      projectLink.target = '_blank';
      projectLink.rel = 'noopener noreferrer';
      links.appendChild(projectLink);
    }

    metaRow.appendChild(links);

    if (publication.published) {
      const published = document.createElement('div');
      published.className = 'pub-published';
      published.textContent = publication.published;
      metaRow.appendChild(published);
    }

    content.appendChild(metaRow);
  }
  
  // Assemble the publication item
  if (showThumbnail && publication.thumbnail) {
    const thumbnail = createThumbnailElement(publication);
    pubItem.appendChild(thumbnail);
  }

  pubItem.appendChild(content);
  
  return pubItem;
}

function createThumbnailElement(publication) {
  const thumbnail = document.createElement('div');
  thumbnail.className = 'pub-thumbnail';
  thumbnail.onclick = () => openModal(publication.thumbnail);

  const thumbnailImg = document.createElement('img');
  thumbnailImg.src = publication.thumbnail;
  thumbnailImg.alt = `${publication.title} thumbnail`;
  thumbnail.appendChild(thumbnailImg);

  return thumbnail;
}

function formatAuthor(author) {
  const escapedAuthor = escapeHtml(author);
  const authorWithMarker = escapedAuthor.replace(/\u2020/g, '<sup class="author-marker">&dagger;</sup>');

  if (author.includes(HIGHLIGHT_AUTHOR)) {
    return `<span class="highlight-name">${authorWithMarker}</span>`;
  }

  return authorWithMarker;
}

function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Modal functionality for viewing original images
function openModal(imageSrc) {
  const modal = document.getElementById('imageModal');
  const modalImg = document.getElementById('modalImage');
  modal.style.display = "block";
  setTimeout(() => {
    modal.classList.add('show');
  }, 10);
  modalImg.src = imageSrc;
}

function closeModal() {
  const modal = document.getElementById('imageModal');
  modal.classList.remove('show');
  setTimeout(() => {
    modal.style.display = "none";
  }, 300);
}

// Close modal when clicking outside the image
window.onclick = function(event) {
  const modal = document.getElementById('imageModal');
  if (event.target == modal) {
    closeModal();
  }
}
