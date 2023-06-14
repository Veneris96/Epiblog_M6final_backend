const cache = new Map()

const cacheMiddleware = (req, res, next) => {
    const { url } = req

    const cachedResponse = cache.get(url)

    if (cachedResponse) { //se nel nostro oggetto esiste questa chiave forniscimela
        return res.send(JSON.parse(cachedResponse))

    }
    res.sendResponse = res.send
    res.send = (body) => {
        cache.set(url, body)
        res.sendResponse(body)
    }
    next()
}
export default cacheMiddleware