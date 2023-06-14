const logger = (req, res, next) => { //funzione che accetta 3 paramentri
    const { url, ip, method } = req

    console.log(`${new Date().toISOString()} ${method} request submitted to endpoint ${url} from address: ${ip}`)

    next() //procedi con la richiesta
}

export default logger