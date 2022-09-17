module.exports = {
    routes: [
        {
            method: 'POST',
            path: '/subscription',
            handler: 'subscription.postAction',
            config: {
                policies: [],
                middlewares: [],
            },
        },
    ],
}
