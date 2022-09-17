'use strict'

/**
 * subscription service
 */

module.exports = {
    subscribe: async email => {
        const client = require('@mailchimp/mailchimp_marketing')
        client.setConfig({
            apiKey: process.env.MAILCHIMP_API_KEY,
            server: process.env.MAILCHIMP_SERVER_PREFIX,
        })

        return await client.lists.batchListMembers(
            process.env.MAILCHIMP_LIST_ID,
            {
                members: [
                    {
                        email_address: email,
                        status: 'pending',
                    },
                ],
            }
        )
    },
}
