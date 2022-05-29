import { createContext, ReactNode, useEffect, useState } from "react";
import Router from "next/router";
import { setCookie, parseCookies, destroyCookie } from "nookies";
import { api } from "../services/api";

type User = {
    email: string;
    permissions: string[];
    roles: string[];
}

type SignInCredentials = {
    email: string;
    password: string;
}

type AuthContextData = {
    signIn(cretendials: SignInCredentials): Promise<void>;
    user: User;
    isAuthenticated: boolean;
}

type AuthProviderProps = {
    children: ReactNode;
}

export const AuthContext = createContext({} as AuthContextData)

export function signOut() {
    destroyCookie(undefined, "nextauth.token")
    destroyCookie(undefined, "nextauth.refreshToken")

    Router.push("/")
}

export function AuthProvider({ children }: AuthProviderProps) {
    const [ user, setUser ] = useState<User>();
    const isAuthenticated = !!user;

    useEffect(() => {
        const { "nextauth.token": token} = parseCookies()
        if(token) {
            api.get("/me").then(response => {
               const { email, permissions, roles} = response.data
               setUser({ email, permissions, roles})
            })
            .catch(() => {
                signOut()
            })
        }
    }, [])

    async function signIn({email, password}: SignInCredentials) {
        try {
            const response = await api.post("sessions", {
                email, 
                password
            })

            const { token, refreshToken, permissions, roles } = response.data
            
            //primeiro parametro é undefined porque no caso de agr tá tudo acontecendo pelo browser (e nao pelo servidor)
            //segundo é o nome do que vc quer armazenar, terceiro o dado q vai armazenar
            //maxAge é qnto tempo pra expirar
            //path: "/" qlquer lugar da aplicação tem acesso ao cookie
            setCookie(undefined, "nextauth.token", token, {
                maxAge: 60 * 60 * 24 * 30, //30 dias
                path: "/"
            })

            setCookie(undefined, "nextauth.refreshToken", refreshToken, {
                maxAge: 60 * 60 * 24 * 30, //30 dias
                path: "/"
            })

            setUser({
                email,
                permissions,
                roles
            })

            api.defaults.headers.common["Authorization"] = `Bearer ${token}`

            Router.push("/dashboard")

        } catch (err) {
            console.log(err)
        }
    }
    return (
        <AuthContext.Provider value={{signIn, isAuthenticated, user }}>
            {children}
        </AuthContext.Provider>
    )
}