'use strict';

/**
 * event service
 */

const { createCoreService } = require('@strapi/strapi').factories;
const axios = require('axios')
const qs = require('qs')
const path = require('path')
const fs = require('fs')
const fetch = require('node-fetch')
const { promisify } = require('util')
const { pipeline } = require('stream')

function parseTitle(event) {
    return event.name
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

function parsePrice(event) {
    const price = event.description.match(/odporúčané\s+(?<price>\d+[,\.]?\d*)/i)
    if (price && 'price' in price.groups) {
        return Number.parseFloat(price.groups['price'].replace(',', '.'))
    }
}

module.exports = createCoreService('api::event.event', ({ strapi }) => ({
    getFacebookData(facebook_id) {
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
        const url = `https://graph.facebook.com/v18.0/${facebook_id}?${qs.stringify(params)}`
        return axios.get(url)
    },

    parseFacebookData(upstreamEvent) {
        return {
            start: upstreamEvent.start_time,
            facebook_title: parseTitle(upstreamEvent),
            facebook_description: upstreamEvent.description,
            facebook_type: parseType(upstreamEvent),
            facebook_price: parsePrice(upstreamEvent),
        }
    },

    async downloadImage(upstreamEvent) {
        const image = path.join('images', `${upstreamEvent.cover.id}.jpg`)

        const filepath = path.resolve(strapi.dirs.static.public, image)
        if (!fs.existsSync(filepath)) {
            const streamPipeline = promisify(pipeline)
            const response = await fetch(upstreamEvent.cover.source)
            await streamPipeline(response.body, fs.createWriteStream(filepath))
        }

        return image
    },
}))
