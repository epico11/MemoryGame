

// import { initializeApp } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-app.js";
// import { getFirestore, collection, addDoc, query, orderBy, limit, getDocs, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";
// import { initializeApp } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-app.js";
// import { getFirestore } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


// const firebaseConfig = {
//   apiKey: "SUA_API_KEY",
//   authDomain: "SEU_AUTH_DOMAIN",
//   projectId: "SEU_PROJECT_ID",
//   storageBucket: "SEU_BUCKET",
//   messagingSenderId: "SEU_ID",
//   appId: "SEU_APP_ID"
// };

 const firebaseConfig = {
    apiKey: "AIzaSyAbdQFxqwOqiIc4AAaGYY7GYEEc6xe1Grw",
    authDomain: "jogo-memoriia-ranking.firebaseapp.com",
    projectId: "jogo-memoriia-ranking",
    storageBucket: "jogo-memoriia-ranking.firebasestorage.app",
    messagingSenderId: "655544993476",
    appId: "1:655544993476:web:032541f05f246a43742b91",
    measurementId: "G-QRPRLP3L2X"
};


const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
