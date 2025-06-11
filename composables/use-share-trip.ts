export default function () {
    const userTripsStore = useUserTripsStore();
    const toast = useToast();
    const i18n = useI18n();

    const publishTrip = async (trip: Trip) => {
        await userTripsStore.updateTrip({
            id: trip.id,
            tripData: {
                isPublished: true,
            },
        });
        toast.add({
            severity: 'secondary',
            summary: i18n.t('INFO_TRIP_PUBLISHED'),
            life: constants.TOAST_TTL,
        });
        analyticsUtils.log(constants.ANALYTICS_EVENTS.PUBLISH_TRIP, {
            trip_id: trip.id,
        });
    };

    const unpublishTrip = async (trip: Trip) => {
        await userTripsStore.updateTrip({
            id: trip.id,
            tripData: {
                isPublished: false,
            },
        });
        toast.add({
            severity: 'secondary',
            summary: i18n.t('INFO_TRIP_UNPUBLISHED'),
            life: constants.TOAST_TTL,
        });
        analyticsUtils.log(constants.ANALYTICS_EVENTS.UNPUBLISH_TRIP, {
            trip_id: trip.id,
        });
    };

    return {
        publishTrip,
        unpublishTrip,
    };
}
