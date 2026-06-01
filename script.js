/* ================================================
   CertifyApp — script.js
   Now with Firebase Authentication + Firestore Database
   Admin logs in → saves template to database
   Students load template from database (not localStorage)
   ================================================ */


/* -----------------------------------------------
   FIREBASE CONFIGURATION
   Your unique Firebase project keys
----------------------------------------------- */
const firebaseConfig = {
  apiKey: "AIzaSyBKSVPFVglXKQkgt_QXT4bKy4z9i_UQ2_Q",
  authDomain: "certifyapp-e7b38.firebaseapp.com",
  projectId: "certifyapp-e7b38",
  storageBucket: "certifyapp-e7b38.firebasestorage.app",
  messagingSenderId: "472095305441",
  appId: "1:472095305441:web:c6324bb095a918ee8c91a0"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Get references to Firebase services
const auth = firebase.auth();           // For admin login/logout
const db   = firebase.firestore();      // For saving/loading template


/* -----------------------------------------------
   PAGE NAVIGATION
----------------------------------------------- */
function showPage(pageId) {
  // Scroll to top instantly
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;

  // If admin tries to go to admin panel, check login first
  if (pageId === 'page-admin') {
    // Check if admin is logged in
    if (!auth.currentUser) {
      // Not logged in → go to login page instead
      showPage('page-admin-login');
      return;
    }
  }

  // Hide all pages
  document.querySelectorAll('.page').forEach(function(p) {
    p.classList.remove('active');
  });

  // Show requested page
  document.getElementById(pageId).classList.add('active');

  // Load template when student page opens
  if (pageId === 'page-student') {
    loadTemplateForStudent();
  }

  // Load saved template into admin form
  if (pageId === 'page-admin') {
    loadTemplateIntoAdmin();
  }

  // Scroll to top again after switch
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
}


/* -----------------------------------------------
   ADMIN LOGIN
   Uses Firebase Authentication
----------------------------------------------- */
function adminLogin() {
  var email    = document.getElementById('login-email').value.trim();
  var password = document.getElementById('login-password').value.trim();

  // Basic validation
  if (!email || !password) {
    showError('login-error', 'Please enter both email and password.');
    return;
  }

  // Show loading
  document.getElementById('login-loading').classList.remove('hidden');
  document.getElementById('login-error').classList.add('hidden');

  // Firebase sign in
  auth.signInWithEmailAndPassword(email, password)
    .then(function(userCredential) {
      // Login successful!
      document.getElementById('login-loading').classList.add('hidden');

      // Clear the form
      document.getElementById('login-email').value = '';
      document.getElementById('login-password').value = '';

      // Go to admin panel
      showPage('page-admin');
    })
    .catch(function(error) {
      // Login failed
      document.getElementById('login-loading').classList.add('hidden');
      showError('login-error', '❌ Wrong email or password. Please try again.');
      console.error('Login error:', error);
    });
}

// Allow pressing Enter key to login
document.addEventListener('keydown', function(e) {
  var loginPage = document.getElementById('page-admin-login');
  if (e.key === 'Enter' && loginPage.classList.contains('active')) {
    adminLogin();
  }
});


/* -----------------------------------------------
   ADMIN LOGOUT
----------------------------------------------- */
function adminLogout() {
  auth.signOut().then(function() {
    showPage('page-home');
  });
}


/* -----------------------------------------------
   ADMIN — BACKGROUND IMAGE PREVIEW
----------------------------------------------- */
function previewBg(event) {
  var file = event.target.files[0];
  if (!file) return;

  var reader = new FileReader();
  reader.onload = function(e) {
    document.getElementById('bg-preview-img').src = e.target.result;
    document.getElementById('bg-preview-box').classList.remove('hidden');
    window._tempBgImage = e.target.result; // store base64
  };
  reader.readAsDataURL(file);
}


/* -----------------------------------------------
   ADMIN — REMOVE BACKGROUND
----------------------------------------------- */
function removeBg() {
  document.getElementById('bg-preview-img').src = '';
  document.getElementById('bg-preview-box').classList.add('hidden');
  document.getElementById('cert-bg').value = '';
  window._tempBgImage = null;
}


/* -----------------------------------------------
   ADMIN — LOAD TEMPLATE INTO FORM
   Loads from Firestore database
----------------------------------------------- */
function loadTemplateIntoAdmin() {
  // Load from Firestore
  db.collection('templates').doc('main').get()
    .then(function(doc) {
      if (doc.exists) {
        var data = doc.data();
        document.getElementById('cert-title').value      = data.title      || '';
        document.getElementById('cert-body').value       = data.body       || '';
        document.getElementById('cert-course').value     = data.course     || '';
        document.getElementById('cert-university').value = data.university || '';

        if (data.bgImage) {
          window._tempBgImage = data.bgImage;
          document.getElementById('bg-preview-img').src = data.bgImage;
          document.getElementById('bg-preview-box').classList.remove('hidden');
        }
      }
    })
    .catch(function(error) {
      console.error('Could not load template:', error);
    });
}


/* -----------------------------------------------
   ADMIN — SAVE TEMPLATE TO FIRESTORE DATABASE
----------------------------------------------- */
function saveTemplate() {
  var title      = document.getElementById('cert-title').value.trim();
  var body       = document.getElementById('cert-body').value.trim();
  var course     = document.getElementById('cert-course').value.trim();
  var university = document.getElementById('cert-university').value.trim();

  if (!title) {
    showError('admin-error', 'Please enter a Certificate Title before saving.');
    return;
  }

  // Show loading
  document.getElementById('admin-loading').classList.remove('hidden');
  document.getElementById('admin-success').classList.add('hidden');
  document.getElementById('admin-error').classList.add('hidden');

  // Build template object
  var template = {
    title:      title,
    body:       body,
    course:     course,
    university: university,
    bgImage:    window._tempBgImage || null,
    updatedAt:  firebase.firestore.FieldValue.serverTimestamp() // saves time of update
  };

  // Save to Firestore — collection: 'templates', document: 'main'
  db.collection('templates').doc('main').set(template)
    .then(function() {
      // Saved successfully!
      document.getElementById('admin-loading').classList.add('hidden');
      document.getElementById('admin-success').classList.remove('hidden');

      // Hide success after 3 seconds
      setTimeout(function() {
        document.getElementById('admin-success').classList.add('hidden');
      }, 3000);
    })
    .catch(function(error) {
      document.getElementById('admin-loading').classList.add('hidden');
      showError('admin-error', '❌ Could not save. Check your internet connection.');
      console.error('Save error:', error);
    });
}


/* -----------------------------------------------
   STUDENT — LOAD TEMPLATE FROM FIRESTORE
----------------------------------------------- */
function loadTemplateForStudent() {
  // Show loading
  document.getElementById('student-loading').classList.remove('hidden');
  document.getElementById('no-template-msg').classList.add('hidden');

  // Load from Firestore
  db.collection('templates').doc('main').get()
    .then(function(doc) {
      document.getElementById('student-loading').classList.add('hidden');

      if (!doc.exists) {
        // No template saved yet
        document.getElementById('no-template-msg').classList.remove('hidden');
        return;
      }

      var data = doc.data();

      // Update certificate preview with database data
      document.getElementById('prev-title').textContent =
        data.title || 'Certificate of Achievement';

      document.getElementById('prev-body').textContent =
        data.body || 'has successfully completed the requirements of the program.';

      document.getElementById('prev-course').textContent =
        data.course || '';

      document.getElementById('prev-university').textContent =
        data.university || '';

      // Set background image if saved
      var cert = document.getElementById('certificate');
      if (data.bgImage) {
        cert.style.backgroundImage = 'url(' + data.bgImage + ')';
      } else {
        cert.style.backgroundImage = 'none';
      }

      // Set today's date
      var today = new Date();
      var dateStr = today.toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric'
      });
      document.getElementById('prev-date').textContent = dateStr;

      // Update name preview
      updatePreview();
    })
    .catch(function(error) {
      document.getElementById('student-loading').classList.add('hidden');
      document.getElementById('no-template-msg').classList.remove('hidden');
      console.error('Load error:', error);
    });
}


/* -----------------------------------------------
   STUDENT — LIVE NAME PREVIEW
----------------------------------------------- */
function updatePreview() {
  var name = document.getElementById('student-name').value.trim();
  document.getElementById('prev-name').textContent = name || 'Your Name Here';
}


/* -----------------------------------------------
   STUDENT — DOWNLOAD CERTIFICATE AS PNG
----------------------------------------------- */
function downloadCert() {
  var name = document.getElementById('student-name').value.trim();
  if (!name) {
    alert('Please enter your name before downloading.');
    return;
  }

  html2canvas(document.getElementById('certificate'), {
    scale: 2,
    useCORS: true,
    backgroundColor: '#ffffff'
  }).then(function(canvas) {
    var link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = name + '_Certificate.png';
    link.click();
  }).catch(function(error) {
    console.error('Download failed:', error);
    alert('Could not generate image. Please try again.');
  });
}


/* -----------------------------------------------
   STUDENT — PRINT CERTIFICATE
----------------------------------------------- */
function printCert() {
  var name = document.getElementById('student-name').value.trim();
  if (!name) {
    alert('Please enter your name before printing.');
    return;
  }
  window.print();
}


/* -----------------------------------------------
   HELPER — Show error message in any element
----------------------------------------------- */
function showError(elementId, message) {
  var el = document.getElementById(elementId);
  el.textContent = message;
  el.classList.remove('hidden');
}


/* -----------------------------------------------
   ON PAGE LOAD — Set date in certificate
----------------------------------------------- */
window.addEventListener('load', function() {
  var today = new Date();
  var dateStr = today.toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric'
  });
  var dateEl = document.getElementById('prev-date');
  if (dateEl) dateEl.textContent = dateStr;
});
