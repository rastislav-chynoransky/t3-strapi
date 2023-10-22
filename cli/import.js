const strapi = require('@strapi/strapi')

strapi()
    .load()
    .then(async instance => {
        const now = new Date()
        const events = await instance.db.query('api::event.event').findMany({
            where: { start: { $gt: now } }
        })

        // triggers lifecycle event listener
        const promises = events.map(event => {
            const data = { facebook_id: event.facebook_id }
            return instance.entityService.update('api::event.event', event.id, { data })
        })

        Promise.all(promises).then(() => {
            process.exit()
        })
    })
