import {
  auth,
  firestore,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendEmailVerification,
  doc,
  setDoc,
  getDoc,
  ref,
  uploadBytes,
  getDownloadURL,
  storage,
} from '../src/config'

//============================/////============================///
// Identify auth action forms
//============================/////============================///
const signUpForm = document.getElementById('wf-form-signup-form')
const signInForm = document.getElementById('wf-form-signin-form')
const signOutButton = document.getElementById('signout-button')
const onboardingForm = document.getElementById('onboarding-form')
const uploaderButton = document.querySelector(
  '[data-ms-action="profile-uploader"]'
)

// Create a hidden file input for image uploads
const fileInput = document.createElement('input')
fileInput.type = 'file'
fileInput.accept = 'image/*' // Accept only image files
fileInput.style.display = 'none' // Hide the input
document.body.appendChild(fileInput)

//============================/////============================///
// Assign event listeners if the elements exist
//============================/////============================///
if (fileInput) {
  fileInput.addEventListener('change', updateProfilePicture)
}
if (signUpForm) {
  signUpForm.addEventListener('submit', handleSignUp)
}
if (signInForm) {
  signInForm.addEventListener('submit', handleSignIn)
}
if (signOutButton) {
  signOutButton.addEventListener('click', handleSignOut)
}
if (onboardingForm) {
  onboardingForm.addEventListener('submit', handleOnboardingSubmit)
}
if (uploaderButton) {
  uploaderButton.addEventListener('click', () => {
    fileInput.click() // Trigger the file input when button is clicked
  })
}

//============================/////============================///
// Function to update the profile picture URL
//============================/////============================///
async function updateProfilePicture() {
  const profileImage = document.querySelector(
    'img[data-ms-member="profile-image"]'
  )
  const profilePicUrlInput = document.querySelector(
    'input[data-ms-member="profile-pic-url"]'
  )

  if (fileInput.files.length === 0) return // Early return if no file selected

  const file = fileInput.files[0]
  const storageRef = ref(storage, `profile_pictures/${file.name}`)

  try {
    // Upload the file
    await uploadBytes(storageRef, file)
    console.log('Uploaded a blob or file!')

    // Get the download URL
    const url = await getDownloadURL(storageRef)
    profileImage.src = url
    profilePicUrlInput.value = url // Update hidden input

    // Update Firestore with the new URL
    const userId = auth.currentUser.uid // Use the actual user ID from the auth object
    await setDoc(
      doc(firestore, 'users', userId),
      { profilePicUrl: url },
      { merge: true }
    )
    console.log('Profile picture URL updated in Firestore')
  } catch (error) {
    console.error('Error uploading file:', error)
  }
}

//============================/////============================///
// Handle sign-up
//============================/////============================///
function handleSignUp(e) {
  e.preventDefault()
  e.stopPropagation()

  const email = document.getElementById('signup-email').value
  const password = document.getElementById('signup-password').value

  console.log('Email is: ' + email)

  createUserWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      const user = userCredential.user
      console.log('User successfully created: ' + user.email)
      sendVerificationEmail() // Send verification email after sign-up
      // Redirect to onboarding page
      window.location.href = `/app/onboarding?authtoken=${userCredential.user.refreshToken}`
    })
    .catch((error) => {
      const errorMessage = error.message
      const errorText = document.getElementById('signup-error-message')
      console.log(errorMessage)
      if (errorText) {
        errorText.innerHTML = errorMessage
      }
    })
}

//============================/////============================///
// Handle sign-in
//============================/////============================///
function handleSignIn(e) {
  e.preventDefault()
  e.stopPropagation()

  const email = document.getElementById('signin-email').value
  const password = document.getElementById('signin-password').value

  signInWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      const user = userCredential.user
      console.log('User logged in: ' + user.email)

      if (user) {
        if (user.emailVerified) {
          console.log('Email verified. Access granted.')
          window.location.href = '/'
        } else {
          console.log('Email not verified.')
          const uid = user.uid

          getDoc(doc(firestore, 'users', uid))
            .then((docSnapshot) => {
              if (docSnapshot.exists()) {
                const userProfile = docSnapshot.data()
                if (!userProfile.name) {
                  window.location.href = '/app/onboarding' // Redirect to onboarding if name is not set
                } else {
                  window.location.href = '/verification' // Redirect to verification if name exists
                }
              } else {
                window.location.href = '/app/onboarding' // Redirect to onboarding
              }
            })
            .catch((error) => {
              console.error('Error retrieving user profile:', error)
            })
        }
      }
    })
    .catch((error) => {
      const errorMessage = error.message
      const errorText = document.getElementById('signin-error-message')
      console.log(errorMessage)
      if (errorText) {
        errorText.innerHTML = errorMessage
      }
    })
}

//============================/////============================///
// Function to send verification email
//============================/////============================///
function sendVerificationEmail() {
  const user = auth.currentUser
  if (user) {
    sendEmailVerification(user)
      .then(() => {
        console.log('Verification email sent!')
      })
      .catch((error) => {
        console.error('Error sending verification email:', error)
      })
  }
}

//============================/////============================///
// Function to check email verification
//============================/////============================///
function checkEmailVerification() {
  const currentPath = window.location.pathname

  function checkVerification(user) {
    if (currentPath === '/verification') {
      if (!user.emailVerified) {
        console.log('Email not verified. Please verify your email.')
      } else {
        window.location.href = '/' // Redirect to home page
        unsubscribe() // Stop listening when verified
      }
    }
  }

  const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
    if (currentUser) {
      await currentUser.reload()
      checkVerification(currentUser)
    } else {
      console.log('No user is signed in.')
    }
  })

  if (currentPath === '/verification') {
    checkVerification(auth.currentUser)
  }
}

//============================/////============================///
// Handle sign-out
//============================/////============================///
function handleSignOut() {
  signOut(auth)
    .then(() => {
      console.log('User signed out')
      clearUserProfileCache() // Clear cache on sign-out
    })
    .catch((error) => {
      const errorMessage = error.message
      console.log(errorMessage)
    })
}

//============================/////============================///
// Handle onboarding form submission
//============================/////============================///
function handleOnboardingSubmit(e) {
  e.preventDefault()
  e.stopPropagation()

  const uid = auth.currentUser?.uid // Avoid errors
  if (uid) {
    handleOnboarding(uid) // Call the onboarding function
  } else {
    console.error('User is not authenticated')
  }
}

//============================/////============================///
// Handle onboarding profile creation
//============================/////============================///
async function handleOnboarding(uid) {
  const name = document.getElementById('onboarding-name').value
  const bio = document.getElementById('onboarding-bio').value

  const docSnapshot = await getDoc(doc(firestore, 'users', uid))
  let pictureUrl = '' // Initialize pictureUrl

  if (docSnapshot.exists()) {
    const userProfile = docSnapshot.data()
    pictureUrl = userProfile.profilePicUrl // Copy profilePicUrl to pictureUrl
  }

  const userProfile = {
    name: name,
    email: auth.currentUser.email,
    pictureUrl: pictureUrl,
    bio: bio,
    createdAt: new Date(),
  }

  try {
    await setDoc(doc(firestore, 'users', uid), userProfile)
    console.log('User profile created successfully!')
    window.location.href = '/'
  } catch (error) {
    console.error('Error creating user profile:', error)
  }
}

//============================/////============================///
// Manage user authentication state
//============================/////============================///
onAuthStateChanged(auth, (user) => {
  const publicElements = document.querySelectorAll("[data-onlogin='hide']")
  const privateElements = document.querySelectorAll("[data-onlogin='show']")

  if (user) {
    const uid = user.uid
    setUserProfileAttributes(uid)
    privateElements.forEach((element) => {
      element.style.display = 'initial'
    })
    publicElements.forEach((element) => {
      element.style.display = 'none'
    })
    console.log(`The current user's UID is equal to ${uid}`)
    checkEmailVerification(user)
  } else {
    publicElements.forEach((element) => {
      element.style.display = 'initial'
    })
    privateElements.forEach((element) => {
      element.style.display = 'none'
    })
  }
})

//============================/////============================///
// Set user profile attributes with caching
//============================/////============================///
async function setUserProfileAttributes(uid) {
  // Check if user profile is cached
  const cachedProfile = JSON.parse(localStorage.getItem(`userProfile_${uid}`))

  if (cachedProfile) {
    updateUIWithUserProfile(cachedProfile)
    return
  }

  try {
    const userDocRef = doc(firestore, 'users', uid)
    const userDoc = await getDoc(userDocRef)

    if (userDoc.exists()) {
      const userProfile = userDoc.data()
      // Cache the user profile
      localStorage.setItem(`userProfile_${uid}`, JSON.stringify(userProfile))
      updateUIWithUserProfile(userProfile)
      console.log('User profile attributes set successfully')
    } else {
      console.error('User profile does not exist')
    }
  } catch (error) {
    console.error('Error fetching user profile:', error)
  }
}
//============================/////============================///
// Update UI with user profile data
//============================/////============================///
function updateUIWithUserProfile(userProfile) {
  const nameElement = document.querySelector('[data-ms-doc="name"]')
  const profilePicElement = document.querySelector(
    '[data-ms-doc="profilepicurl"]'
  )
  const emailElement = document.querySelector('[data-ms-doc="email"]')
  const bioElement = document.querySelector('[data-ms-doc="bio"]')
  const navprofileElement = document.querySelector(
    '[data-ms-doc="nav-profile"]'
  )

  if (nameElement) {
    nameElement.textContent = userProfile.name || ''
  }

  if (profilePicElement) {
    profilePicElement.src = userProfile.pictureUrl || ''
  }

  if (navprofileElement) {
    navprofileElement.style.backgroundImage = `url(${
      userProfile.pictureUrl || ''
    })`
  }

  if (emailElement) {
    emailElement.textContent = userProfile.email || ''
  }

  if (bioElement) {
    bioElement.textContent = userProfile.bio || ''
  }
}

//============================/////============================///
// Clear user profile cache on logout
//============================/////============================///
function clearUserProfileCache() {
  const user = auth.currentUser
  if (user) {
    localStorage.removeItem(`userProfile_${user.uid}`)
  }
}

// Store event listeners
const eventListeners = []

// Function to add an event listener and track it
function addEventListenerWithTracking(element, event, handler) {
  element.addEventListener(event, handler)
  eventListeners.push({ element, event, handler })
}

// Function to log active listeners
function logActiveListeners() {
  console.log('Active Event Listeners:')
  eventListeners.forEach((listener, index) => {
    console.log(
      `${index + 1}: ${listener.event} on ${listener.element.tagName} (ID: ${
        listener.element.id
      })`
    )
  })
}

// Assign event listeners if the elements exist
if (fileInput) {
  addEventListenerWithTracking(fileInput, 'change', updateProfilePicture)
}
if (signUpForm) {
  addEventListenerWithTracking(signUpForm, 'submit', handleSignUp)
}
if (signInForm) {
  addEventListenerWithTracking(signInForm, 'submit', handleSignIn)
}
if (signOutButton) {
  addEventListenerWithTracking(signOutButton, 'click', handleSignOut)
}
if (onboardingForm) {
  addEventListenerWithTracking(onboardingForm, 'submit', handleOnboardingSubmit)
}
if (uploaderButton) {
  addEventListenerWithTracking(uploaderButton, 'click', () => {
    fileInput.click() // Trigger the file input when button is clicked
  })
}

// Call this function whenever you want to log active listeners
logActiveListeners()
