import {
  firestore,
  collection,
  addDoc,
  query,
  orderBy,
  limit,
  onSnapshot,
  doc,
  getDoc,
  getAuth,
  signInAnonymously,
} from '../src/config'

const messagesList = document.getElementById('messagesList')
const messageForm = document.getElementById('messageForm')
const messageInput = document.getElementById('messageInput')

const auth = getAuth() // Ensure auth is initialized

// Sign in anonymously
signInAnonymously(auth)
  .then(() => {
    console.log('User signed in', auth.currentUser)
  })
  .catch((error) => {
    console.error('Error signing in:', error)
  })

// Function to get user profile data
const getUserProfile = async (uid) => {
  const userDoc = doc(firestore, 'users', uid)
  const docSnapshot = await getDoc(userDoc)
  if (docSnapshot.exists()) {
    return docSnapshot.data()
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

  // Get user profile to fetch pictureUrl
  const userProfile = await getUserProfile(user.uid)
  const photoURL = userProfile ? userProfile.pictureUrl : 'default_image_url'

  try {
    await addDoc(collection(firestore, 'messages'), {
      text: messageText,
      createdAt: new Date(),
      uid: user.uid,
      photoURL: photoURL,
    })
    messageInput.value = '' // Clear input after sending
  } catch (error) {
    console.error('Error adding document: ', error)
  }
}

// Listen for new messages in real-time
const messagesQuery = query(
  collection(firestore, 'messages'),
  orderBy('createdAt', 'asc'),
  limit()
) // Limit should have a number
onSnapshot(messagesQuery, (querySnapshot) => {
  messagesList.innerHTML = ''
  querySnapshot.forEach((doc) => {
    const msg = doc.data()
    const messageClass = msg.uid === auth.currentUser.uid ? 'sent' : 'received'
    const messageElement = document.createElement('div')
    messageElement.classList.add('message', messageClass)
    messageElement.innerHTML = `
      <img src="${msg.photoURL || 'default_image_url'
      }" alt="User Avatar" style="width: 40px; height: 40px; border-radius: 50%;" />
      <p>${msg.text}</p>
    `
    messagesList.appendChild(messageElement)
  })
  messagesList.scrollTop = messagesList.scrollHeight
})

// Add event listener to the form
messageForm.addEventListener('submit', sendMessage)
