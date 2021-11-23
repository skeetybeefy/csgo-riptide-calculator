import Reward from './Reward'
import './Rewards.css'
import { useEffect, useState } from 'react'
import errorImg from './assets/error.png'

const IP = "http://localhost:8069/data"

function Rewards() {

    const [data, setData] = useState([])
    const [isLoaded, setIsLoaded] = useState(false)
    const [error, setError] = useState(null)

    useEffect(() => {
        (async () => {
            try {
                const resp = await fetch(IP)
                const data = await resp.json()
                setIsLoaded(true)
                setData(data)
            } catch (e) {
                setIsLoaded(true)
                setError(e)
            }
        })()
    }, [])


    if (!isLoaded) {
        return (
            <section>
                <p className="loading-msg">Loading...</p>
            </section>
        )
    } else if (error) {
        return (
            <section>
                <img src={errorImg} alt="error" className="error-img"></img>
                <p>There was an error loading data. Try to refresh the page. If the error is still present, try to wait several minutes before refreshing the page.</p>
            </section>
        )
    } else {
        return (
            <section>
                {data.map((component, index) => {
                    return index === 0 ? <Reward data={component} first={true}></Reward> : <Reward data={component}></Reward>
                })}
            </section>
        )
    }    
}

export default Rewards