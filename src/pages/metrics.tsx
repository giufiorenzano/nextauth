import { GetServerSideProps } from "next"
import { setupAPIClient } from "../services/api"
import { withSSRAuth } from "../utils/withSSRAuth"

export default function Metrics() {
    
    return (
        <>
        <h1>Metrics</h1>
        
        </>
        
    )
}

export const getServerSideprops: GetServerSideProps = withSSRAuth(async (ctx) => {
    const apiClient = setupAPIClient(ctx)
    const response = await apiClient.get("/me")

    return {
        props: {}
    }
}, {
    permissions: ["metrics.list"],
    roles: ["administrator"],
})