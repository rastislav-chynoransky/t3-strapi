const strapi = require('@strapi/strapi')
const qs = require('qs')
const axios = require('axios')

let instance

async function importData(response) {
    const events = response.data.data

    const publishedAt = new Date()
    for (const event of events) {
        let entry = await instance.db.query('api::event.event').findOne({
            where: { facebook_id: event.id },
        })

        const data = {
            facebook_title: parseTitle(event.name),
            facebook_description: event.description,
            start: event.start_time,
            canceled: event.is_canceled,
            image: event.cover.source,
        }

        if (entry) {
            await instance.entityService.update('api::event.event', entry.id, {
                data,
            })
        } else {
            await instance.entityService.create('api::event.event', {
                data: {
                    ...data,
                    facebook_id: event.id,
                    type: parseType(event),
                    publishedAt,
                    price: parsePrice(event.description),
                },
            })
        }
    }

    return response
}

function parseTitle(title) {
    return title
        .replace(/^zhluk\s+@[\p{L}\p{N}]+[\s:-]+/iu, '')
        .replace(/\bzhluk\b/i, '')
        .replace(/t3xethno:\s*/i, '')
        .replace(/\btrammed\b/i, '')
        .replace(/\s+\([a-z]{2,3}\)/gi, '')
        .replace(/@.*$/, '')
        .replace(/(\p{L})&(\p{L})/gu, '$1 & $2')
        .replace(/(.*?):\s+(.*?)/g, '$1:\n$2')
        .replace(/(.*?),\s+(.*?)/g, '$1,\n$2')
        .replace(/(.*?)\s+\/\s+(.*?)/g, '$1,\n$2')
        .replace(/^[\s|:-]+/, '')
        .replace(/[\s|:-]+$/, '')
        .replace(/w y m e/, 'w\u202Fy\u202Fm\u202Fe')
}

function parseType(event) {
    if (event.category === 'TV_AND_MOVIES') {
        return 'kino'
    }

    if (event.category === 'CLASSIC_LITERATURE') {
        return 'čítačka'
    }

    if (event.category === 'THEATER') {
        return 'divadlo'
    }

    if (event.name.match(/T3xEThno/)) {
        return 'ethno'
    }

    if (event.name.match(/\bzhluk\b/i)) {
        return 'zhluk'
    }

    if (event.name.match(/trammed/i)) {
        return 'trammed'
    }
}

function parsePrice(description) {
    const price = description.match(/odporúčané\s+(?<price>\d+[,\.]?\d*)/i)
    if (price && 'price' in price.groups) {
        return Number.parseFloat(price.groups['price'].replace(',', '.'))
    }
}

function load(url) {
    return axios
        .get(url)
        .then(importData)
        .then(response => {
            if (response.data.paging.next) {
                return load(response.data.paging.next)
            }
        })
}

strapi()
    .load()
    .then(async strapiInstance => {
        instance = strapiInstance
        // await instance.db.query('api::event.event').deleteMany()

        const params = {
            fields: [
                'cover',
                'description',
                'name',
                'start_time',
                'category',
                'is_canceled',
                'is_draft',
                'is_page_owned',
            ].join(','),
            access_token: process.env.FACEBOOK_ACCESS_TOKEN,
        }
        const url = `https://graph.facebook.com/v15.0/1330722593663777/events?${qs.stringify(
            params
        )}`

        load(url)
            .then(() => {
                instance.stop(0)
            })
            .catch(err => {
                console.log(err)
                instance.stop(1)
            })
    })
