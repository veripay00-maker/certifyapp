/* ================================================
   CertifyApp — script.js
   Plain JavaScript. No frameworks, no backend.
   All data is stored in localStorage.
   ================================================ */


/* -----------------------------------------------
   PAGE NAVIGATION
   Shows one page, hides all others.
   Called from HTML onclick attributes.
----------------------------------------------- */
function showPage(pageId) {
  // Scroll to the very top FIRST — instant, before anything else
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0; // Safari fallback

  // Hide all pages
  document.querySelectorAll('.page').forEach(function(p) {
    p.classList.remove('active');
  });

  // Show the requested page
  document.getElementById(pageId).classList.add('active');

  // When going to the student page, load saved template
  if (pageId === 'page-student') {
    loadTemplateForStudent();
  }

  // When going to admin, load any previously saved values
  if (pageId === 'page-admin') {
    loadTemplateIntoAdmin();
  }

  // Scroll again after page switch just to be safe
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
}


/* -----------------------------------------------
   ADMIN — BACKGROUND IMAGE PREVIEW
   Called when the file input changes.
----------------------------------------------- */
function previewBg(event) {
  var file = event.target.files[0];

  // If no file selected, do nothing
  if (!file) return;

  // FileReader converts the image file to a base64 string
  var reader = new FileReader();

  reader.onload = function(e) {
    // Show preview image
    document.getElementById('bg-preview-img').src = e.target.result;
    document.getElementById('bg-preview-box').classList.remove('hidden');

    // Temporarily store in a global variable (saved when admin clicks Save)
    window._tempBgImage = e.target.result;
  };

  reader.readAsDataURL(file); // Reads file as base64
}


/* -----------------------------------------------
   ADMIN — REMOVE BACKGROUND IMAGE
----------------------------------------------- */
function removeBg() {
  // Clear preview
  document.getElementById('bg-preview-img').src = '';
  document.getElementById('bg-preview-box').classList.add('hidden');

  // Clear file input
  document.getElementById('cert-bg').value = '';

  // Clear temp variable
  window._tempBgImage = null;
}


/* -----------------------------------------------
   ADMIN — LOAD SAVED TEMPLATE INTO FORM FIELDS
   So the admin sees what they saved before.
----------------------------------------------- */
function loadTemplateIntoAdmin() {
  // Get saved template from localStorage (returns null if nothing saved)
  var saved = localStorage.getItem('certTemplate');
  if (!saved) return; // Nothing saved yet

  var template = JSON.parse(saved); // Convert JSON string back to object

  // Fill in form fields with saved values
  document.getElementById('cert-title').value      = template.title      || '';
  document.getElementById('cert-body').value       = template.body       || '';
  document.getElementById('cert-course').value     = template.course     || '';
  document.getElementById('cert-university').value = template.university || '';

  // Show background preview if one was saved
  if (template.bgImage) {
    window._tempBgImage = template.bgImage;
    document.getElementById('bg-preview-img').src = template.bgImage;
    document.getElementById('bg-preview-box').classList.remove('hidden');
  }

  // Hide success message (it was from a previous save)
  document.getElementById('admin-success').classList.add('hidden');
}


/* -----------------------------------------------
   ADMIN — SAVE TEMPLATE TO localStorage
   Called when admin clicks "Save Template".
----------------------------------------------- */
function saveTemplate() {
  // Collect form values (trim removes extra spaces)
  var title      = document.getElementById('cert-title').value.trim();
  var body       = document.getElementById('cert-body').value.trim();
  var course     = document.getElementById('cert-course').value.trim();
  var university = document.getElementById('cert-university').value.trim();

  // Require at least a title
  if (!title) {
    alert('Please enter a Certificate Title before saving.');
    return;
  }

  // Build the template object
  var template = {
    title:      title,
    body:       body,
    course:     course,
    university: university,
    bgImage:    window._tempBgImage || null  // base64 string or null
  };

  // Save to localStorage as a JSON string
  localStorage.setItem('certTemplate', JSON.stringify(template));

  // Show success message
  var successMsg = document.getElementById('admin-success');
  successMsg.classList.remove('hidden');

  // Auto-hide success message after 3 seconds
  setTimeout(function() {
    successMsg.classList.add('hidden');
  }, 3000);
}


/* -----------------------------------------------
   STUDENT — LOAD TEMPLATE AND UPDATE PREVIEW
   Called when student page loads.
----------------------------------------------- */
function loadTemplateForStudent() {
  var saved = localStorage.getItem('certTemplate');

  if (!saved) {
    // No template found — show error message
    document.getElementById('no-template-msg').classList.remove('hidden');
    return;
  }

  // Hide error if it was showing
  document.getElementById('no-template-msg').classList.add('hidden');

  var template = JSON.parse(saved);

  // Update certificate preview elements with saved template data
  document.getElementById('prev-title').textContent =
    template.title || 'Certificate of Achievement';

  document.getElementById('prev-body').textContent =
    template.body || 'has successfully completed the requirements of the program.';

  document.getElementById('prev-course').textContent =
    template.course || '';

  document.getElementById('prev-university').textContent =
    template.university || '';

  // Set background image on the certificate div if one was saved
  var cert = document.getElementById('certificate');
  if (template.bgImage) {
    cert.style.backgroundImage = 'url(' + template.bgImage + ')';
  } else {
    cert.style.backgroundImage = 'none';
  }

  // Set today's date in the date field
  var today = new Date();
  var dateStr = today.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  document.getElementById('prev-date').textContent = dateStr;

  // Also update the name preview with whatever is in the input
  updatePreview();
}


/* -----------------------------------------------
   STUDENT — LIVE NAME PREVIEW
   Called every time the student types in the name field.
----------------------------------------------- */
function updatePreview() {
  var name = document.getElementById('student-name').value.trim();

  // Show placeholder text if field is empty
  document.getElementById('prev-name').textContent = name || 'Your Name Here';
}


/* -----------------------------------------------
   STUDENT — DOWNLOAD CERTIFICATE AS PNG
   Uses html2canvas to capture the certificate div.
----------------------------------------------- */
function downloadCert() {
  // Check that a name was entered
  var name = document.getElementById('student-name').value.trim();
  if (!name) {
    alert('Please enter your name before downloading.');
    return;
  }

  // The element to capture
  var certElement = document.getElementById('certificate');

  // html2canvas renders the element to a <canvas>
  html2canvas(certElement, {
    scale: 2,                  // 2x resolution for sharper output
    useCORS: true,             // allow cross-origin images
    backgroundColor: '#ffffff' // white background
  }).then(function(canvas) {

    // Convert canvas to a PNG image URL
    var imageURL = canvas.toDataURL('image/png');

    // Create a temporary link and click it to trigger download
    var link = document.createElement('a');
    link.href = imageURL;
    link.download = name + '_Certificate.png';  // filename
    link.click();

  }).catch(function(error) {
    console.error('Download failed:', error);
    alert('Could not generate image. Please try again.');
  });
}


/* -----------------------------------------------
   STUDENT — PRINT CERTIFICATE
   Opens the browser print dialog.
   CSS @media print hides everything except cert.
----------------------------------------------- */
function printCert() {
  // Check that a name was entered
  var name = document.getElementById('student-name').value.trim();
  if (!name) {
    alert('Please enter your name before printing.');
    return;
  }

  // Trigger browser print
  window.print();
}


/* -----------------------------------------------
   ON PAGE LOAD
   Set up any initial state.
----------------------------------------------- */
window.addEventListener('load', function() {
  // Set today's date in the certificate preview
  var today = new Date();
  var dateStr = today.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  var dateEl = document.getElementById('prev-date');
  if (dateEl) dateEl.textContent = dateStr;
});
