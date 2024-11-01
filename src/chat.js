import {
  firestore,
  signInWithEmailAndPassword,
  getAuth,
  doc,
  setDoc,
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  limit,
  getDoc,
} from '../src/config'

// DOM Elements
const messagesList = document.getElementById('messagesList')
const messageForm = document.getElementById('messageForm')
const messageInput = document.getElementById('messageInput')
const chatSubmitButton = document.getElementById('chat-submit')
const onlineUserList = document.getElementById('online-user')
const loginForm = document.getElementById('loginForm') // Add this for login
const emailInput = document.getElementById('emailInput') // Add this for email input
const passwordInput = document.getElementById('passwordInput') // Add this for password input
const userProfileImg = document.getElementById('user-pfl')

// Check if the current source is the default image URL
if (userProfileImg.src === 'default_image_url') {
  userProfileImg.src = 'https://cdn-icons-png.flaticon.com/512/2202/2202112.png' // Set fallback image
}

// Initialize Firebase Auth
const auth = getAuth()

// Sign in with email and password
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault()

  const email = emailInput.value
  const password = passwordInput.value

  try {
    await signInWithEmailAndPassword(auth, email, password)
    console.log('User logged in:', auth.currentUser)
    fetchAndDisplayAllUsers() // Fetch online users after logging in
  } catch (error) {
    console.error('Login failed:', error)
  }
})

// Fetch and display all user profiles
const fetchAndDisplayAllUsers = async () => {
  try {
    const usersCollection = collection(firestore, 'users')
    const usersQuery = query(usersCollection, orderBy('name'))
    onSnapshot(usersQuery, (querySnapshot) => {
      onlineUserList.innerHTML = '' // Clear previous list
      querySnapshot.forEach(async (doc) => {
        const userProfile = doc.data()
        const profileElement = document.createElement('div')
        profileElement.classList.add('online-user')
        profileElement.innerHTML = `
          <img src="${userProfile.profilePicUrl || 'default_image_url'}" alt="${userProfile.name
          }" style="width: 40px; height: 40px; border-radius: 50%;" />
          <span>${userProfile.name}</span>
          <span class="status">${userProfile.isOnline ? 'Online' : 'Offline'
          }</span>
        `
        onlineUserList.appendChild(profileElement)
      })
    })
  } catch (error) {
    console.error('Error fetching user profiles:', error)
  }
}

// Function to get user profile data with caching
const getUserProfile = async (uid) => {
  const cachedProfile = JSON.parse(localStorage.getItem(`userProfile_${uid}`))
  if (cachedProfile) {
    return cachedProfile // Return cached data
  }
  const userDoc = doc(firestore, 'users', uid)
  const docSnapshot = await getDoc(userDoc)
  if (docSnapshot.exists()) {
    const userProfile = docSnapshot.data()
    localStorage.setItem(`userProfile_${uid}`, JSON.stringify(userProfile))
    return userProfile
  } else {
    console.error('User profile not found')
    return null
  }
}

// Function to send messages
const sendMessage = async (e) => {
  e.preventDefault()
  e.stopPropagation()

  const user = auth.currentUser
  if (!user) {
    console.error('User not authenticated')
    return
  }

  const messageText = messageInput.value.trim()
  if (!messageText) {
    console.error('Message input is empty')
    return
  }

  messageInput.value = ''

  const recipientUid = 'recipientUserId' // Replace with actual recipient user ID
  const userProfile = await getUserProfile(user.uid)
  const photoURL = userProfile
    ? userProfile.profilePicUrl
    : 'https://cdn-icons-png.flaticon.com/512/2202/2202112.png'

  // Optimistically add the message to the UI
  const messageElement = document.createElement('div')
  messageElement.classList.add('message', 'sent')
  messageElement.innerHTML = `
    <img src="${photoURL}" alt="User Avatar" style="width: 40px; height: 40px; border-radius: 50%;" />
    <p>${messageText}</p>
  `
  messagesList.appendChild(messageElement)
  messagesList.scrollTop = messagesList.scrollHeight

  try {
    await addDoc(
      collection(firestore, `messages/${user.uid}/${recipientUid}`),
      {
        text: messageText,
        createdAt: new Date(),
        uid: user.uid,
        photoURL: photoURL,
      }
    )
    await addDoc(
      collection(firestore, `messages/${recipientUid}/${user.uid}`),
      {
        text: messageText,
        createdAt: new Date(),
        uid: user.uid,
        photoURL: photoURL,
      }
    )
  } catch (error) {
    console.error('Error adding document: ', error)
    messagesList.removeChild(messageElement)
  }

  messageInput.style.display = 'none' // Hide input after sending
}

// Listen for new messages in real-time
const listenForMessages = async (recipientUid) => {
  const messagesQuery = query(
    collection(firestore, `messages/${auth.currentUser.uid}/${recipientUid}`),
    orderBy('createdAt', 'asc'),
    limit(50)
  )

  onSnapshot(messagesQuery, (querySnapshot) => {
    messagesList.innerHTML = ''
    querySnapshot.forEach((doc) => {
      const msg = doc.data()
      const messageClass =
        msg.uid === auth.currentUser.uid ? 'sent' : 'received'
      const messageElement = document.createElement('div')
      messageElement.classList.add('message', messageClass)
      messageElement.innerHTML = `
        <img src="${msg.photoURL || 'default_image_url'
        }" alt="User Avatar" id="user-pfl" style="width: 40px; height: 40px; border-radius: 50%;" />
        <p>${msg.text}</p>
      `
      messagesList.appendChild(messageElement)
    })
    messagesList.scrollTop = messagesList.scrollHeight
  })
}

// Call listenForMessages with the recipient's UID
listenForMessages('recipientUserId') // Replace with actual recipient user ID

// Add event listener to the form
messageForm.addEventListener('submit', sendMessage)

// Add event listener to the submit button
chatSubmitButton.addEventListener('click', sendMessage)

// Add event listener for the Enter key
messageInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    sendMessage(e)
  }
})

// Optional: Update user's online status in Firestore
const updateOnlineStatus = async () => {
  const user = auth.currentUser
  if (user) {
    await setDoc(
      doc(firestore, 'users', user.uid),
      {
        isOnline: true, // Update user's online status
      },
      { merge: true }
    )
  }
}

// Call this function to set online status
updateOnlineStatus()


