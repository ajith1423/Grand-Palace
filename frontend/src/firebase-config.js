import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyD19d68Igg07w143j7ILrqobV8QnqN5SF4",
    authDomain: "gpgt-66169.firebaseapp.com",
    projectId: "gpgt-66169",
    storageBucket: "gpgt-66169.firebasestorage.app",
    messagingSenderId: "123136029387",
    appId: "1:123136029387:web:3d0f5ba891bfb2522aa14e",
    measurementId: "G-JV88TCZ6CY"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export default app;
