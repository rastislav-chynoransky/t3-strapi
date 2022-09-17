'use strict'

/**
 * A set of functions called "actions" for `subscription`
 */

module.exports = {
    postAction: async (ctx, next) => {
        try {
            const email = ctx.request.body.email
            const response = await strapi.services[
                'api::subscription.mailchimp'
            ].subscribe(email)

            if (response.errors.length) {
                throw response.errors.map(error => error.error).join('\n')
            }

            ctx.response.status = 201
        } catch (err) {
            ctx.badRequest(err)
        }
    },
}
