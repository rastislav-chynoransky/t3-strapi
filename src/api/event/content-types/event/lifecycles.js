const updateFacebookData = async (data) => {
    if (!data.facebook_id) return

    const eventService = strapi.service('api::event.event')
    const facebookData = (await eventService.getFacebookData(data.facebook_id)).data
    const newData = eventService.parseFacebookData(facebookData)
    newData.image = await eventService.downloadImage(facebookData)
    Object.assign(data, newData)
};

module.exports = {
    async beforeCreate(event) {
        await updateFacebookData(event.params.data)
    },
    async beforeUpdate(event) {
        await updateFacebookData(event.params.data)
    },
};
