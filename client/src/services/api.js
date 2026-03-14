import axios from 'axios';

const api = axios.create({
    baseURL: "https://yapper-hub-a-chat-app.vercel.app/",
    withCredentials: true
})

export default api;