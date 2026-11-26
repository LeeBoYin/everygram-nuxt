import { keyBy as _keyBy } from 'lodash-es';
import {
    collection,
    addDoc,
    doc,
    updateDoc,
    deleteDoc,
    onSnapshot,
    query,
    where,
    deleteField,
    serverTimestamp,
} from 'firebase/firestore';

export const useUserTripsStore = defineStore('userTripsStore', () => {
    const db = firebaseUtils.getFirestoreDB();
    const userStore = useUserStore();
    const { user } = storeToRefs(userStore);
    const tripCollectionRef = collection(db, 'trip');
    const trips = ref<Trip[]>([]);
    const tripMap = computed(() => _keyBy(trips.value, 'id'));
    const isFirstFetching = ref(true);
    const unsubscribe = ref<null | (() => void)>(null);
    const isInitialized = ref(false);

    const getTripById = computed(() => (id: string) => tripMap.value[id]);

    const initialize = () => {
        if (isInitialized.value || !user.value) {
            console.error('initialize useUserTripsStore fail');
            return;
        }
        unsubscribe.value = onSnapshot(
            query(
                tripCollectionRef,
                where(`role.${user.value.uid}`, '==', constants.ROLES.OWNER),
            ),
            (querySnapshot) => {
                trips.value = querySnapshot.docs.map(
                    (doc) =>
                        ({
                            ...constants.EMPTY_TRIP_DATA,
                            ...doc.data(),
                            id: doc.id,
                        }) as Trip,
                );
                if (isFirstFetching.value) {
                    isFirstFetching.value = false;
                }
            },
        );
        isInitialized.value = true;
    };

    const destroy = () => {
        if (unsubscribe.value) {
            unsubscribe.value();
        }

        // reset all ref values
        trips.value = [];
        isInitialized.value = false;
        isFirstFetching.value = true;
        unsubscribe.value = null;
    };

    const createTrip = async (trip: EditingTrip) => {
        if (!user.value) {
            return;
        }
        try {
            const docRef = await addDoc(tripCollectionRef, {
                ...constants.EMPTY_TRIP_DATA,
                ...trip,
                role: {
                    [user.value.uid]: constants.ROLES.OWNER,
                },
                created: serverTimestamp(),
            });
            return docRef.id;
        } catch (error) {
            console.error(error);
            throw error;
        }
    };

    const updateTrip = async ({
        id,
        tripData,
    }: {
        id: string;
        tripData: EditingTrip;
    }) => {
        if (!user.value) {
            console.error('updateTrip fail');
            return;
        }
        try {
            // don't mutate the caller's object
            const { id: _id, ...data } = tripData;
            const trip = getTripById.value(id);
            await updateDoc(doc(tripCollectionRef, id), {
                ...data,
                ...(!trip?.isPublished && data.isPublished
                    ? { published: serverTimestamp() }
                    : {}),
                updated: serverTimestamp(),
            });
        } catch (error) {
            console.error(error);
            throw error;
        }
    };

    const deleteTrip = async (id: string) => {
        if (!user.value) {
            console.error('deleteTrip fail');
            return;
        }
        try {
            await deleteDoc(doc(tripCollectionRef, id));
        } catch (error) {
            console.error(error);
            throw error;
        }
    };

    const setGearsToTrip = async (
        tripId: string,
        tripGears: TripGear[],
        type: TripGearType,
    ) => {
        const newGearsData = _keyBy(tripGears, (gear) => `${type}.${gear.id}`);
        try {
            await updateTrip({ id: tripId, tripData: newGearsData });
        } catch (error) {
            console.error(error);
            throw error;
        }
    };

    const removeGearsFromTrip = async (
        tripId: string,
        gearIds: string[],
        type: TripGearType,
    ) => {
        const removeGearsData = gearIds.reduce(
            (acc, gearId) => {
                acc[`${type}.${gearId}`] = deleteField();
                return acc;
            },
            {} as Record<string, any>,
        );
        await updateTrip({
            id: tripId,
            tripData: removeGearsData,
        });
    };

    const addConsumableToTrip = async ({
        tripId,
        consumable,
    }: {
        tripId: string;
        consumable: Consumable;
    }) => {
        try {
            const trip = getTripById.value(tripId);
            if (!trip) {
                throw 'fail to add consumable to trip, trip not found';
            }
            await updateTrip({
                id: tripId,
                tripData: {
                    [`consumables.${consumable.id}`]: consumable,
                },
            });
        } catch (error) {
            console.error(error);
            throw error;
        }
    };

    const updateConsumableInTrip = async ({
        tripId,
        consumableId,
        consumable,
    }: {
        tripId: string;
        consumableId: string;
        consumable: Consumable;
    }) => {
        try {
            const trip = getTripById.value(tripId);
            if (!trip) {
                throw 'fail to update consumable in trip, trip not found';
            }
            if (!trip.consumables[consumableId]) {
                throw 'fail to update consumable in trip, consumable not found';
            }
            await updateTrip({
                id: tripId,
                tripData: {
                    [`consumables.${consumable.id}`]: consumable,
                },
            });
        } catch (error) {
            console.error(error);
            throw error;
        }
    };

    const deleteConsumableFromTrip = async ({
        tripId,
        consumableId,
    }: {
        tripId: string;
        consumableId: string;
    }) => {
        try {
            const trip = getTripById.value(tripId);
            if (!trip) {
                throw 'fail to remove consumable from trip, trip not found';
            }
            if (!trip.consumables[consumableId]) {
                throw 'fail to remove consumable from trip, consumable not found';
            }
            await updateTrip({
                id: tripId,
                tripData: {
                    [`consumables.${consumableId}`]: deleteField(),
                },
            });
        } catch (error) {
            console.error(error);
            throw error;
        }
    };

    return {
        trips,
        tripMap,
        isFetchingTrips: isFirstFetching,
        getTripById,
        initialize,
        destroy,
        createTrip,
        updateTrip,
        deleteTrip,
        setGearsToTrip,
        removeGearsFromTrip,
        addConsumableToTrip,
        updateConsumableInTrip,
        deleteConsumableFromTrip,
    };
});
