import axios, { AxiosError } from "axios";
import { parseCookies, setCookie } from "nookies";

let cookies = parseCookies();
let isRefreshing = false;
let failedRequestsQueue = [];

export const api = axios.create({
    baseURL: "http://localhost:3333",
    headers: {
        Authorization: `Bearer ${cookies["nextauth.token"]}`
    }
});

//dois parametros no uso: 
//1 = o que fazer se a resposta der sucesso
//2 = o que fazer se a resposta der erro
api.interceptors.response.use(response => {
    return response;
}, (error: AxiosError) => {
    if(error.response.status === 401) {
        if(error.response.data?.code === "token.expired") {
            //renovar o token
            cookies = parseCookies();

            const { "nextauth.refreshToken": refreshToken } = cookies;

            const originalConfig = error.config

            if(!isRefreshing) {
                isRefreshing = true

                api.post("/refresh", {
                    refreshToken
                }).then(response => {
                    const { token } = response.data
    
                    setCookie(undefined, "nextauth.token", token, {
                        maxAge: 60 * 60 * 24 * 30, //30 dias
                        path: "/"
                    })
        
                    setCookie(undefined, "nextauth.refreshToken", response.data.refreshToken, {
                        maxAge: 60 * 60 * 24 * 30, //30 dias
                        path: "/"
                    })
    
                    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
                    
                    failedRequestsQueue.forEach(request => request.onSuccess(token))
                    failedRequestsQueue = []
                
                }).catch(err => {
                    failedRequestsQueue.forEach(request => request.onFailure(err))
                    failedRequestsQueue = []
                }).finally(() => {
                    isRefreshing = false;
                })

            } 

            return new Promise((resolve, reject) => {
                failedRequestsQueue.push({
                    onSuccess: (token: string) => {
                        originalConfig.headers["Authorization"] = `Bearer ${token}`
                        
                        resolve(api(originalConfig))
                    },
                    onFailure: (error: AxiosError) => {
                        reject(error)
                    },
                })
            })

           
        } else {
            // desligar o usuário
        }
    }
})